# Instructions for resetting Database

From the base directory (contains ```package.json``` and ```assets```):
```
rm kipventory/db.sqlite3
rm kipventory/api/migrations/0*
rm -r kipventory/api/migrations/__pycache__/
```

Now remake migrations and migrate.
```
python kipventory/manage.py makemigrations
python kipventory/manage.py migrate
```
