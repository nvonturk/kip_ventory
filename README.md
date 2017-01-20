# kip-ventory
An online inventory system for use by the Duke ECE department.

Semester project for ECE 458.

# Requirements
http://people.duke.edu/~tkb13/courses/ece458/ev1.pdf

# Setup and Installation

Run the following to setup your local environment.

*Note: these commands assume you have *```node```* installed, and are running Python 3.5.*

Setup a ```virtualenv``` and install the necessary packages (```virtualenv``` comes packaged with Python 3.5):
```
python -m venv env
source env/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Install required node packages via npm:
```
npm install
```

Transpile and bundle JavaScript resources with ```webpack``` and ```babel```:
```
./node_modules/.bin/webpack --config webpack.config.js
```

Start the Django server on port 8000:
```
python kipventory/manage.py runserver 8000
```

Now navigate to ```localhost:8000``` and verify that everything is working.
