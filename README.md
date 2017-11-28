# Inventory_System
Design project, ECE 458

# Requirements
http://people.duke.edu/~tkb13/courses/ece458/ev1.pdf

# Setup and Installation

Clone.
```
git clone https://github.com/nbv3/kip_ventory
cd kip_ventory
```

Create and activate new Python 3 ```virtualenv```.
```
python3 -m venv env
source env/bin/activate
```

Install ```pip``` and ```npm``` packages.
```
pip install --upgrade pip
pip install -r requirements.txt
npm install
```

Compile JSX and place in Django application's ```static``` directory via ```webpack``` (see webpack.config.js).
```
npm run build
```

(If you haven't yet created an administrator account for the site, do it now).
```
python kipventory/manage.py createsuperuser
```

Start Postgres Server (locally).
```
pg_ctl -D /usr/local/var/postgres -l logfile start
psql postgres
```

Start Django server.
```
python kipventory/manage.py runserver
```
