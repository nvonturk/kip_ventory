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

###### Set environment variables for Django production server.
```
export SECRET_KEY='[your secret key]'
export DJANGO_URL='[your URL, ie. colab-sbx-[XXX].oit.duke.edu]'
export DJANGO_IP='[your IP]'
export DB_NAME='[your database name]'
export DB_USER='[your database user]'
export DB_PASSWORD=['your database user password']
```

Profit.
