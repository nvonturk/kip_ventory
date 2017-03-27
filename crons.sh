#!/usr/bin/env bash
#Backup bash script
#In linux server call crontab -e
#Add the following line with no blank lines after commented instructions
#*/5 * * * * /home/bitnami/kip_ventory/crons.sh
#--force is only for testing
source /home/bitnami/kip_ventory/env/bin/activate
python /home/bitnami/kip_ventory/kipventory/manage.py runcrons --force > /home/bitnami/cron.log 2>&1
deactivate
