#!/usr/bin/env bash

# remove old db.sqlite3 file if it still exists
if [ -f ./kipventory/db.sqlite3 ]; then
    rm ./kipventory/db.sqlite3
fi

# remove all migrations
rm -r ./kipventory/api/migrations/0*
rm -r ./kipventory/api/migrations/__pycache__/

# reset the database, make new migrations, and configure superuser
python kipventory/manage.py flush --noinput
python kipventory/manage.py makemigrations
python kipventory/manage.py migrate
python kipventory/manage.py createsuperuser
