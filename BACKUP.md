Backup Guide (Ubuntu 16.04)
=====


### Obtain the Backup Dump You Wanted
SSH into the backup server which in our case is colab-sbx-395.oit.duke.edu, and switch to the root user.  Change directory to /backup/ and identify which backup you want.  The zipped pg_dump is within /backup/choosen_backup/localhost/postgres/.  Unzip the the pg_dump file.  Then scp the file to the bitnami directory on your production server.

```
ssh -X bitnami@colab-sbx-XXX.oit.duke.edu
sudo -i
cd /backup/choosen_backup/localhost/postgres/
gunzip postgresql-dump.sql.gz
sudo scp postgresql-dump.sql bitnami@colab-sbx-XXX.oit.duke.edu:/home/bitnami
```

Now SSH into you production server, which in our case is colab-sbx-277.oit.duke.edu. Run the following commands to restore your database from the copied pg_dump file in the /home/bitnami directory.

```
ssh -X bitnami@colab-sbx-XXX.oit.duke.edu
cd /home/bitnami/
dropdb dbname
psql postgres
create user user with password 'password';
alter role user set client_encoding to 'utf8';
alter role user set default_transaction_isolation to 'read committed';
alter role kip set timezone to 'EST';
create database dbname;
grant all privileges on database dbname to user;
grant all privileges on database kipventory to bitnami;
psql dbname < postgresql-dump.sql
```
