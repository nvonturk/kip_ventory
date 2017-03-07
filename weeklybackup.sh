#!/usr/bin/env bash
#First Copy Most Recent File to Weekly
#Then while size of directory is greater than 4 delete oldest

#Copy most recent file to weekly directory
find /home/bitnami/ -type f -name "*.dump" -printf "%T+\t%p\n" | sort | tail -n 1 > newest
read time newestFile < newest

sudo cp $newestFile /home/weekly/

shopt -s nullglob # cause unmatched globs to return empty, rather than the glob itself
find /home/weekly/ -type f -name "*.dump" | wc -l > temp
read files < temp
#If number of files in weekly directory > 4
while (( $files > 4 ))
do
   #Delete oldest file
   find /home/weekly/ -type f -name "*.dump" -printf "%T+\t%p\n" | sort | head -n 1 > oldest
   read time oldestFile < oldest
   sudo rm $oldestFile
   #Reset number of files variable
   find /home/weekly/ -type f -name "*.dump" | wc -l > temp
   read files < temp
done
shopt -u nullglob

#0 0 * * sun /home/bitnami/weeklybackup.sh
