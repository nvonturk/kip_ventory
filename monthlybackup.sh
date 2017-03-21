#!/usr/bin/env bash
#First Copy Most Recent File to Monthly
#Then while size of directory is greater than 12 delete oldest

#Copy most recent file to weekly directory
find /home/bitnami/ -type f -name "*.dump" -printf "%T+\t%p\n" | sort | tail -n 1 > newest
read time newestFile < newest

sudo cp $newestFile /home/monthly/

shopt -s nullglob # cause unmatched globs to return empty, rather than the glob itself
find /home/monthly/ -type f -name "*.dump" | wc -l > temp
read files < temp
#If number of files in weekly directory > 12
while (( $files > 12 ))
do
   #Delete oldest file
   find /home/monthly/ -type f -name "*.dump" -printf "%T+\t%p\n" | sort | head -n 1 > oldest
   read time oldestFile < oldest
   echo $oldestFile
   sudo rm $oldestFile
   #Reset number of files variable
   find /home/monthly/ -type f -name "*.dump" | wc -l > temp
   read files < temp
done
shopt -u nullglob

#0 0 1 * * /home/bitnami/monthlybackup.sh
