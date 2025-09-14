This section contains the data management tools that were used in order to access iSpindel readings.

## Prerequisites

- Python environment with Flask 3.0.3+

- iSpindel is set to HTTP Post towards localhost:5000\ispindel

Check versions:
```
pip show flask
```

## Setup and Run

1) Install dependencies in your Python environment(if not yet installed):
```
pip install flask
```

2) Navigate to the app folder:
```
cd data\
```

3) Create the .db file by running the SQLite python script:
```
python sqlite.py
```

4) Start the flask development server:
```
python app.py
```

## Additional Information for testing

This segment is to test the database by using curl method to insert dummy data. Make sure flask server (app.py) is running when you do this procedure.

1) Run the test python script to insert dummy data:
```
python test_db.py
```

2) Using your CLI, check if data is reflecting on the database file:
```
curl http://localhost:5000/readings/001
```