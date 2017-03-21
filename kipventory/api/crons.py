from django_cron import CronJobBase, Schedule
from . import models, serializers
from django.core.mail import EmailMultiAlternatives
from datetime import datetime
from django.utils import timezone
from django.conf import settings

def loanToString(loan):
    #maybe include request's date_closed
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
    RUN_AT_TIMES = ['23:49']
    RUN_EVERY_MINS = 1

    schedule = Schedule(run_at_times=RUN_AT_TIMES, run_every_mins=RUN_EVERY_MINS)
    code = 'kipventory.send_email'    # a unique code

    def sendLoanReminderEmail(self, loan_reminder, loan_reminder_contents):
        bcc_emails = []
        from_email = settings.EMAIL_HOST_USER
        subject_tag = models.SubjectTag.objects.get()

        for username, loan_reminder_content in loan_reminder_contents.items():
            to_emails = [loan_reminder_content["user"].email]
            text_content = loan_reminder.body + "\n\n" + loansToString(loan_reminder_content["loans"])
            html_content = text_content #maybe figure out how to use a template
            sendEmail(subject_tag.text, text_content, html_content, from_email, to_emails, bcc_emails)
        #todo delete loanReminder or mark as sent?

    def do(self):
        print("send email cronjob starting")

        # Check if a loan reminder email(s) should be sent
        loan_reminders_to_send = models.LoanReminder.objects.filter(date__lte=timezone.now()) #todo check timezones datetime.now() vs timezone.now()
        print(loan_reminders_to_send)

        # Determine which users have recorded loans
        recorded_loans = models.Loan.objects.all() #todo filter to exclude returned loans
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
           
    '''
    def do(self):
        print("send email cronjob starting")

        # Populate loan reminder emails for testing
        #for l in models.LoanReminderEmail.objects.all():
        	#l.delete()
        loan_reminder = models.LoanReminderEmail.objects.create(body="Test")
        loan_reminder.save()

        # Check if a loan reminder email(s) should be sent
        #now = datetime.now
        #loan_reminder_emails_to_send = models.LoanReminderEmail.objects.filter(date<now)
        loan_reminder_emails_to_send = models.LoanReminderEmail.objects.all()
        print(loan_reminder_emails_to_send)
       
        bcc_emails = ["schreck.jeremy@gmail.com", "kipventory@gmail.com"]
        from_email = "kipventory@gmail.com"
        to_emails = []
        subject = "[Kipventory: Loan Reminder]"
        
        for loan_reminder_email in loan_reminder_emails_to_send:
       	    text_content = loan_reminder_email.body
       	    html_content = loan_reminder_email.body #maybe figure out how to use a template
            msg = EmailMultiAlternatives(subject, text_content, from_email, to_emails, bcc_emails)
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            loan_reminder_email.delete() # or mark as sent
    '''
       	
