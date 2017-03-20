import os
from django.core import management
from django.conf import settings
from django_cron import CronJobBase, Schedule
from django.core.mail import send_mail, mail_admins

class Backup(CronJobBase):
    RUN_AT_TIMES = ['06:00']
    schedule = Schedule(run_at_times=RUN_AT_TIMES)
    code = 'kipventory.Backup'

    def do(self):
        print("Running cron backup")
        management.call_command('dbbackup')
