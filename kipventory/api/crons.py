from django_cron import CronJobBase, Schedule
from . import models, serializers
from django.core.mail import EmailMultiAlternatives
from datetime import datetime
from django.utils import timezone
from django.conf import settings
from django.db.models import F


DOMAIN = "https://colab-sbx-277.oit.duke.edu/"
REQUESTS_URL = "{}{}".format(DOMAIN, "app/requests/")

def loanToString(loan):
    #todo maybe include request's date_closed
    request_url = "{}{}".format(REQUESTS_URL, loan.request.id)
    return "Link: {} \nItem: {} \nQuantity Loaned: {} \nQuantity Returned: {}".format(request_url, loan.item, loan.quantity_loaned, loan.quantity_returned)

def loansToString(loans, loan_reminder_body):
    intro = "The following is a list of your recorded loans with a link to each loan:\n\n"
    loansString = "{}\n\n{}".format(loan_reminder_body, intro)
    loansString = ""
    for loan in loans:
        loansString += loanToString(loan)
        loansString += "\n\n"
    return loansString

def loanToHtml(loan):
    request_url = "{}{}".format(REQUESTS_URL, loan.request.id)
    return "<a href='{}''>{}</a><ul><li>Item: {}</li><li>Quantity Loaned {}</li><li>Quantity Returned {}</li></ul>".format(request_url, request_url, loan.item, loan.quantity_loaned, loan.quantity_returned)

def loansToHtml(loans, loan_reminder_body):
    intro = "<p>The following is a list of your recorded loans with a link to each loan:</p>"
    loansHtml = "{}<br/><br/>{}".format(loan_reminder_body, intro)
    for loan in loans:
        loansHtml += loanToHtml(loan)
        loansHtml += "<hr/>"
    return loansHtml

def sendEmail(subject, text_content, html_content, from_email, to_emails, bcc_emails):
    msg = EmailMultiAlternatives(subject, text_content, from_email, to_emails, bcc_emails)
    msg.attach_alternative(html_content, "text/html")
    msg.send()

class SendLoanReminderEmail(CronJobBase):
    RUN_AT_TIMES = ['08:00'] # TODO Deal with timezones. Currently it uses TIMEZONE from settings.py, which is UTC

    schedule = Schedule(run_at_times=RUN_AT_TIMES)
    code = 'kipventory.send_loan_reminder_email'    # a unique code

    def sendLoanReminderEmail(self, loan_reminder, loan_reminder_contents):
        bcc_emails = []
        from_email = settings.EMAIL_HOST_USER
        subject_tag = models.SubjectTag.objects.get()
        subject = "{} {}".format(subject_tag.text, loan_reminder.subject)
        for username, loan_reminder_content in loan_reminder_contents.items():
            to_emails = [loan_reminder_content["user"].email]
            loan = loan_reminder_content["loans"]
            text_content = loansToString(loan, loan_reminder.body)
            html_content = loansToHtml(loan, loan_reminder.body)
            try:
                sendEmail(subject, text_content, html_content, from_email, to_emails, bcc_emails)
            except:
                #todo deal with this
                pass
        
        loan_reminder.sent = True
        loan_reminder.save()

    def do(self):
        print("send email cronjob starting")
        print(timezone.now())

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
            
            