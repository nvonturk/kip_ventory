#!/usr/bin/env bash
#Backup bash script
#In linux server call crontab -e
#Add the following line with no blank lines after commented instructions
#*/5 * * * * /home/bitnami/kip_ventory/backup.sh
source /home/bitnami/kip_ventory/env/bin/activate
python /home/bitnami/kip_ventory/kipventory/manage.py runcrons
deactivate
