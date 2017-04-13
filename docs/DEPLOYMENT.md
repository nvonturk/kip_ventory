Deployment Guide (Ubuntu 16.04)
=====

First up, obtain a fresh install of Ubuntu 16.04 (Xenial). We tested on Duke OIT VMs.
`ssh -X` (to allow `x11` forwarding) and execute the following.

## Configuring Django, nginx, and gunicorn

###### Install Ubuntu package dependencies
```
sudo apt-get update
sudo apt-get install python3-pip python3-dev libpq-dev postgresql postgresql-contrib nginx software-properties-common libgtk2.0 git nodejs-legacy npm python3-venv letsencrypt
```

**OPTIONAL** Sublime Text will make your life easier - we'll have to copy/paste quite a bit.
```
sudo add-apt-repository ppa:webupd8team/sublime-text-3
sudo apt-get update
sudo apt-get install sublime-text-installer
```


###### Clone the Git repository
```
git clone http://github.com/nbv3/kip_ventory
cd kip_ventory
```


###### Create a Python3 virtual environment and install dependencies
```
python3 -m venv env
source env/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install psycopg2 gunicorn
```

##### Update settings.py
```
TODO: allowed hosts ifconfig
```

###### Install node.js dependencies
```
npm install
```


###### Configure postgres
```
sudo -u postgres psql
CREATE DATABASE your_database_name;
CREATE USER [your_username_here] WITH PASSWORD '[your_password_here]';
ALTER ROLE [your_username_here] SET client_encoding TO 'utf8'
ALTER ROLE [your_username_here] SET default_transaction_isolation TO 'read committed';
ALTER ROLE [your_username_here] SET timezone TO 'EST';
GRANT ALL PRIVILEGES ON DATABASE [your_database_name] TO [your_username_here];
\q
```

###### Make Django migrations
Use the included script to remove any old database files, create migrations, and migrate.
```
./resetdb.sh
```



###### Compile and collect static files
```
npm run build
python kipventory/manage.py collectstatic
```



###### Configure `gunicorn`

Open a `gunicorn` config file.
```
sudo subl /etc/systemd/system/gunicorn.service
```

Copy and paste the following code into the `gunicorn` config file.
```
[Unit]
Description=gunicorn daemon
After=network.target

[Service]
User=bitnami
Group=www-data
WorkingDirectory=/home/bitnami/kip_ventory/kipventory
ExecStart=/home/bitnami/kip_ventory/env/bin/gunicorn --workers 3 --bind unix:/home/bitnami/kip_ventory/kipventory/kipventory.sock kipventory.wsgi:application

[Install]
WantedBy=multi-user.target
```
Save and close the file.

Now, start the gunicorn process, and enable it to restart on boot.
```
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
```


###### Initial nginx Configuration
Open a new nginx config file.
```
sudo subl /etc/nginx/sites-available/kipventory
```
Copy and paste the following code into the file (replace `[XXX]` with your specific url).
```
server {
    listen 80;
    listen [::]:80;
    server_name colab-sbx-[XXX].oit.duke.edu;

    location = /favicon.ico { access_log off; log_not_found off; }

    location /build/ {
        root /home/bitnami/kip_ventory/kipventory;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/bitnami/kip_ventory/kipventory/kipventory.sock;
    }
}
```

Make sure nginx is configured properly:
```
sudo rm /etc/nginx/sites-enabled/kipventory
sudo ln -s /etc/nginx/sites-available/kipventory /etc/nginx/sites-enabled
sudo nginx -t
sudo ufw allow 'Nginx Full'
sudo systemctl restart nginx
```

Now, you should be able to access your app (unsecured, HTTP only) at your URL. Verify that this works before moving on.



## Adding HTTPS/SSL

###### Configure SSL
Create a signed certificate with `letsencrypt`. First, we have to stop the `nginx` process.
```
sudo systemctl stop nginx
sudo letsencrypt certonly -d colab-sbx-[XXX].oit.duke.edu
sudo systemctl start nginx
```
Create a new `nginx` config snippet - these are just reusable config blocks.
```
sudo subl /etc/nginx/snippets/ssl-colab-sbx-[XXX].oit.duke.edu.conf
```
Copy and paste the following code into the snippet.
```
ssl_certificate /etc/letsencrypt/live/colab-sbx-[XXX].oit.duke.edu/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/colab-sbx-[XXX].oit.duke.edu/privkey.pem;
```
Save and close the file.


Create a 2048-bit Diffie-Hellman Group (lol I have no idea what that means).
```
sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
```
Open another `nginx` config snippet.
```
sudo subl /etc/nginx/snippets/ssl-params.conf
```
Copy and paste the following code into the snippet.
```
# from https://cipherli.st/
# and https://raymii.org/s/tutorials/Strong_SSL_Security_On_nginx.html

ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
ssl_prefer_server_ciphers on;
ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
ssl_ecdh_curve secp384r1;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
# Disable preloading HSTS for now.  You can use the commented out header line that includes
# the "preload" directive if you understand the implications.
#add_header Strict-Transport-Security "max-age=63072000; includeSubdomains; preload";
add_header Strict-Transport-Security "max-age=63072000; includeSubdomains";
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;

ssl_dhparam /etc/ssl/certs/dhparam.pem;
```
Save and close the file.




###### Configure `nginx`

Open an `nginx` config file.
```
sudo subl /etc/nginx/sites-available/kipventory
```
Copy and paste the following code into the `nginx` config file.

```
server {
    listen 80;
    listen [::]:80;
    server_name colab-sbx-[XXX].oit.duke.edu;

    return 301 https://$server_name$request_uri;

}

server {

    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    include snippets/ssl-colab-sbx-[XXX].oit.duke.edu.conf;
    include snippets/ssl-params.conf;

    location = /favicon.ico { access_log off; log_not_found off; }

    location /build/ {
        root /home/bitnami/kip_ventory/kipventory;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/bitnami/kip_ventory/kipventory/kipventory.sock;
    }
}
```
Save and close the file.

Verify that the config is valid.
```
sudo nginx -t
```
If you get an error message, double check that your configs match, and that you've replaced all of the [XXX]s with your URL.

We just configured `nginx` to redirect any HTTP traffic on port 80 to the HTTPS port 443, where we
have an SSL certificate set up.

Symlink the config file to the `sites-enabled` directory to allow `nginx` to serve it.
You might have to remove the file from the sites-enabled directory if you've already done this.
```
sudo rm /etc/nginx/sites-enabled/kipventory
sudo ln -s /etc/nginx/sites-available/kipventory /etc/nginx/sites-enabled
```

Now allow `nginx` to accept HTTP requests on port 80 and HTTPS requests on port 443.
```
sudo ufw allow 'Nginx Full'
sudo systemctl restart nginx
```

## Configuring Emails

###### Install and run RabbitMQ
```
# Download rabbitmq. Follow instructions at https://www.rabbitmq.com/install-debian.html
echo 'deb http://www.rabbitmq.com/debian/ testing main' | sudo tee /etc/apt/sources.list.d/rabbitmq.list
wget -O- https://www.rabbitmq.com/rabbitmq-release-signing-key.asc | sudo apt-key add -
sudo apt-get update
sudo apt-get install rabbitmq-server
```
```
# Setup rabbitmq. Follow instructions at http://docs.celeryproject.org/en/latest/getting-started/brokers/rabbitmq.html
sudo rabbitmqctl add_user kip kipcoonley
sudo rabbitmqctl add_vhost kipvhost
sudo rabbitmqctl set_user_tags kip kiptag
sudo rabbitmqctl set_permissions -p kipvhost kip ".*" ".*" ".*"
```
```
# Run rabbitmq
sudo rabbitmq-server -detached # runs in background (sudo "rabbitmq-server" to run synchronously)
# Invoke 'sudo rabbitmqctl status' to check whether it is running.
# Invoke 'sudo rabbitmqctl stop' to stop it
```

###### Install and run Celery
```
# Make sure celery is installed in your virtual environment
# If you're not already in your virtual env run the following:
cd /home/bitnami/kip_ventory
source env/bin/activate

# Then run the following to make sure celery is installed
pip install -r requirements.txt 
```
```
# Run celery (make sure you are within kipventory directory)
cd /home/bitnami/kip_ventory/kipventory
celery -A kipventory worker -l info --detach
# Check that it's running with `ps aux | grep "celery"`. You should see 3 workers
```

###### Make sure settings.py is updated for production
```
# This line should be commented out
#EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# This line should be uncommented
EMAIL_BACKEND =   'djcelery_email.backends.CeleryEmailBackend'
```

###### Set up Loan Reminders cron job
```
# Change crons.sh to be executable 
cd /home/bitnami/kip_ventory/
sudo chmod +x crons.sh
# Make sure crons.sh is in production mode (no --force)
#python /home/bitnami/kip_ventory/kipventory/manage.py runcrons --force > /home/bitnami/cron.log 2>&1 #wrong
python /home/bitnami/kip_ventory/kipventory/manage.py runcrons > /home/bitnami/cron.log 2>&1 #correct
```
```
# Set up crontab to run crons.sh every 5 min
crontab -e
*/5 * * * * /home/bitnami/kip_ventory/crons.sh
```

## Configuring a Backup Server with RSnapshot and PostgreSQL

#### On the Backup Server

SSH into your backup server and switch to the root user. Running the following commands to install and configure rsnapshot and set up ssh keys between your backup and production servers.

When generating your ssh key ensure that you press enter to take the default/blank value for the passphrase and for key location.
```
ssh bitnami@colab-sbx-XXX.oit.duke.edu
sudo -i
sudo apt-get install rsnapshot
sudo ssh-keygen -t rsa
sudo ssh-copy-id -i /root/.ssh/id_rsa.pub bitnami@colab-sbx-XXX.oit.duke.edu
```

Next test whether your SSH keys are working and ssh into your production machine from your backup server.  You should successfully authenticate without being prompted to enter a password.
```
ssh bitnami@colab-sbx-XXX.oit.duke.edu
//exit if successful
```
Next create the /root/.pgpass file that will be used to authenticate into your PostgreSQL database.  Enter these values into the .pgpass file.
```
hostname:port:database:username:password
```
After this is done we can create our backup script. Create the backup bash script at /usr/local/bin/ and enter the following.
```
#!/bin/bash
export PGPASS=/root/.pgpass

ssh bitnami@colab-sbx-XXX.oit.duke.edu  pg_dump -w -U bitnami dbname > postgresql-dump.sql

gzip postgresql-dump.sql

if [ "$?" -ne 0 ]
then
 curl https://colab-sbx-277.oit.duke.edu/api/backupemail/?status=failure -H 'Authorization: Token ADMIN_AUTH_TOKEN'
else
 curl https://colab-sbx-277.oit.duke.edu/api/backupemail/?status=success -H 'Authorization: Token ADMIN_AUTH_TOKEN'
fi
```
You will need to copy paste an admin authentication API token from the user interface in order for this script to successfully authenticate and perform a complete database backup.


Next we will configure rsnapshot on the backup server.  First set the value of your backup directory.  When editing the rsnapshot.conf file only use tabs do not use spaces.
```
snapshot_root   /backup/
```
Uncomment the cmd_ssh line.
```
cmd_ssh /usr/bin/ssh
```
Enter the following values in the BACKUP LEVELS / INTERVALS section.  Number may change if you wish to change the number of retained backups for a certain time frame.
```
retain  hourly  6
retain  daily   7
retain  weekly  4
retain  monthly 12
```
Change the following global options for debugging ease.  Additionally, uncomment the logfile global option.
```
verbose         5
...
loglevel        5
...
logfile /var/log/rsnapshot.log
```
Finally add the backup script that we created in the BACKUP POINTS SECTION of the config file.
```
backup_script   /usr/local/bin/your_script.sh     localhost/postgres/
```
Additionally change the permissions on both your script and the backup script to be 644.
```
chmod 644 /root/.pgpass
chmod 644 /usr/local/bin/your_script.sh
```
Run the following command to ensure that the syntax of your rsnapshot configuration is correct.
```
rsnapshot configtest
```
In order to automate the running of rsnapshot uncomment and modify the values of the cron jobs in /etc/cron.d/rsnapshot.  They should look something like the following:
```
0 */4         * * *           root    /usr/bin/rsnapshot hourly
30 3          * * *           root    /usr/bin/rsnapshot daily
0  3          * * 1           root    /usr/bin/rsnapshot weekly
30 2          1 * *           root    /usr/bin/rsnapshot monthly
```
Please see crontab documentation to schedule the jobs to tailor your needs.  Additionally be sure to have the rsnapshot of the greatest time interval running first on any given day, as is done in the above example.  This helps ensure proper retention of backups.

#### On the Production Server

Now it is time to enable your PostgreSQL database for backups. SSH on to your production server and edit the /etc/postgresql/version_number/main/postgresql.conf file.

Uncomment the following parameter in the CONNECTIONS AND AUTHENTICATION section to enable a connection to the database.
```
listen_addresses = 'localhost'
```
Now restart PostgreSQL on your server.
```
sudo systemctl restart  postgresql
```

Next we are going to set up a bitnami user in your database that will be used for backups. Perform the following commands to set up the user.
```
sudo -u postgres psql dbname
create user bitnami with password 'your_production_bitnami_password';
alter role bitnami with superuser;
```

Your backup configuration is now complete.
