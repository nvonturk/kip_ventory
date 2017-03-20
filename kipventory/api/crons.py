from django_cron import CronJobBase, Schedule
from . import models, serializers
from django.core.mail import EmailMultiAlternatives
from datetime import datetime


class SendEmail(CronJobBase):
    RUN_AT_TIMES = ['23:49']
    RUN_EVERY_MINS = 1

    schedule = Schedule(run_at_times=RUN_AT_TIMES, run_every_mins=RUN_EVERY_MINS)
    code = 'kipventory.send_email'    # a unique code

    def do(self):
        print("send email cronjob starting")
        #for l in models.LoanReminderEmail.objects.all():
        	#l.delete()
        
        loanReminder = models.LoanReminderEmail.objects.create(body="Test")
        loanReminder.save()

        #now = datetime.now
        #loanReminderEmailsToSend = models.LoanReminderEmail.objects.filter(date<now)
        #usersToSendEmailTo = models.User.objects.filter(loan_set==not_empty)
        #usersToSendEmailTo = loan.user for loans in models.Loan.objects.all()
        #bcc_emails = user.email for user in usersToSendEmailTo
        #subject = models.SubjectTag.objects.get()

        subject = "[Kipventory: Loan Reminder]"
        bcc_emails = ["schreck.jeremy@gmail.com", "kipventory@gmail.com"]
        to_emails = []
        from_email = "kipventory@gmail.com"
        loanReminderEmailsToSend = models.LoanReminderEmail.objects.all()
        print(loanReminderEmailsToSend)
        for loanReminderEmail in loanReminderEmailsToSend:
       	    text_content = loanReminderEmail.body
       	    print(text_content)
       	    html_content = loanReminderEmail.body
            msg = EmailMultiAlternatives(subject, text_content, from_email, to_emails, bcc_emails)
            msg.attach_alternative(html_content, "text/html")
            print(msg.subject)
            msg.send()
       	
