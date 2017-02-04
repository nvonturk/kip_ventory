#!/usr/bin/env bash

if [ ! -f ./kipventory/db.sqlite3 ]; then
    echo "Error - navigate to the root of the repository"
fi

rm ./kipventory/db.sqlite3
rm -r ./kipventory/api/migrations/0*
rm -r ./kipventory/api/migrations/__pycache__/

python kipventory/manage.py makemigrations
python kipventory/manage.py migrate
python kipventory/manage.py createsuperuser
