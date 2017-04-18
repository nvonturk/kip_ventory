Deployment Update Guide (Ubuntu 16.04)
=====

If you have already gone through the steps in DEPLOYMENT.md and just need to update your production server with new code, ssh into your production server and execute the following.


###### Pull code changes
```
cd /home/bitnami/kip_ventory/
sudo git pull origin master # replace master with the branch you want to pull from
```

###### Update settings.py
```
sudo vi kipventory/settings.py 

# Change the - lines to the + lines for production

-DEBUG = True
+DEBUG = False

-ALLOWED_HOSTS = [] 
+ALLOWED_HOSTS = ['colab-sbx-277.oit.duke.edu', '152.3.52.30']

-EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
+#EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
 
-# EMAIL_BACKEND =   'djcelery_email.backends.CeleryEmailBackend'
+EMAIL_BACKEND =   'djcelery_email.backends.CeleryEmailBackend'
```


If there are changes to your database models do the following:

###### Reset the database in postgres
```
sudo -u postgres psql

drop database kipventory;
create database kipventory;
grant all privileges on database kipventory to kip;
```
```
# Now run the resetdb script
source env/bin/activate
./resetdb.sh 
```

###### Reset the frontend
```
npm run build
python kipventory/manage.py collectstatic
```

###### Make sure emails are set up
```
sudo rabbitmqctl status # should be running
ps aux | grep "celery" # should have 3 workers
# To start celery if it's not up:
pip install -r requirements.txt 
cd /home/bitnami/kip_ventory/kipventory
celery -A kipventory worker -l info --detach
```



###### Update the server
```
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

