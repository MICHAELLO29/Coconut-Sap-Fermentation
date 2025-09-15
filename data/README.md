This section contains the data management tools that were used in order to access iSpindel readings.

## Prerequisites

- Flask (3.0.3+)
- flask-cors (6.0.1+)
- iSpindel is set to HTTP Post towards localhost:5000\ispindel

Check versions:
```
pip show flask
pip show flask-cors
```

## Setup and Run

1) Install dependencies in your Python environment(if not yet installed):
```
pip install flask
pip install flask-cors
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

# Additional Information for testing

This segment is to test the database by using curl method to insert dummy data. Make sure flask server (app.py) is running when you do this procedure.
Note: If you are to use the same database file, please make sure to drop dummy data before logging actual readings.

## Adding dummy data to the iSpindel
1) Run the test python script to insert dummy data:
```
python test_db.py
```

2) Using your CLI, check if data is reflecting on the database file:
```
curl http://localhost:5000/readings/001
```

## Check if data reflects using test.html
1) On the first few lines of app.py, and change origins set to "*". This will open up to all origins.
```
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}) 
```
Change to:
```
CORS(app, resources={r"/*": {"origins": "*"}}) 
```

2) While Flask server runs, open the test website. Running this on CLI will open with your default browser:
```
test.html
```
3) Open Developer Tools (F12)

4) Navigate to Console tab

5) Check lines that contain "Data received: " with the json as its content

