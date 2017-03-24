from django_cron import CronJobBase, Schedule
from . import models, serializers
from django.core.mail import EmailMultiAlternatives
from datetime import datetime
from django.utils import timezone
from django.conf import settings
from django.db.models import F


def loanToString(loan):
    #todo maybe include request's date_closed
    return "Item: {} \nQuanity Loaned: {} \nQuantity Returned: {}".format(loan.item, loan.quantity_loaned, loan.quantity_returned)

def loansToString(loans):
    loansString = ""
    for loan in loans:
        loansString += loanToString(loan)
        loansString += "\n\n"
    return loansString

def sendEmail(subject, text_content, html_content, from_email, to_emails, bcc_emails):
    msg = EmailMultiAlternatives(subject, text_content, from_email, to_emails, bcc_emails)
    msg.attach_alternative(html_content, "text/html")
    msg.send()

class SendLoanReminderEmail(CronJobBase):
    RUN_AT_TIMES = ['15:50'] # TODO Deal with timezones. Currently it uses TIMEZONE from settings.py, which is UTC

    schedule = Schedule(run_at_times=RUN_AT_TIMES)
    code = 'kipventory.send_email'    # a unique code

    def sendLoanReminderEmail(self, loan_reminder, loan_reminder_contents):
        bcc_emails = []
        from_email = settings.EMAIL_HOST_USER
        subject_tag = models.SubjectTag.objects.get()
        subject = "{} {}".format(subject_tag.text, loan_reminder.subject)
        for username, loan_reminder_content in loan_reminder_contents.items():
            to_emails = [loan_reminder_content["user"].email]
            text_content = loan_reminder.body + "\n\n" + loansToString(loan_reminder_content["loans"])
            html_content = text_content #todo maybe figure out how to use a template
            sendEmail(subject, text_content, html_content, from_email, to_emails, bcc_emails)

        loan_reminder.sent = True
        loan_reminder.save()

    def do(self):
        print("send email cronjob starting")

        # Check if a loan reminder email(s) should be sent
        loan_reminders_to_send = models.LoanReminder.objects.filter(sent=False).filter(date__lte=timezone.now()) #todo check timezones datetime.now() vs timezone.now()
        print(loan_reminders_to_send)

        # Determine which users have recorded loans (exclude returned loans)
        recorded_loans = models.Loan.objects.filter(quantity_loaned__gt=F('quantity_returned'))
        loan_reminder_contents = {}
        for loan in recorded_loans:
            user = models.User.objects.get(username=loan.request.requester)
            if user.username in loan_reminder_contents:
                loan_reminder_content = loan_reminder_contents[user.username]
                loan_reminder_content["loans"].append(loan)
            else:
                loan_reminder_content = {"loans": [loan], "user": user}
                loan_reminder_contents[user.username] = loan_reminder_content

        print(loan_reminder_contents)
        
        for loan_reminder in loan_reminders_to_send:
            self.sendLoanReminderEmail(loan_reminder, loan_reminder_contents)