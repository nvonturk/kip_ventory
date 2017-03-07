#!/usr/bin/env bash
#Delete all backups in daily backups older than 7 days.
sudo find /home/bitnami/ -type f -name "*.dump" -mtime +7 -exec rm -rf {} \;
