#!/bin/bash
#* * * * * source /home/ubuntu/.bashrc && source /home/bitnami/kip_ventory/env/bin/activate && python /home/bitnami/kip_ventory/kipventory/manage.py runcrons > /home/ubuntu/cronjob.log
#Backup bash script

source /home/bitnami/kip_ventory/env/bin/activate
python /home/bitnami/kip_ventory/kipventory/manage.py runcrons --force > /home/bitnami/cronlogs/cronjob.log
