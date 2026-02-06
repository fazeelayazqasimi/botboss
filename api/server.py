from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Allow all origins for development

# Data file paths
DATA_FOLDER = 'data'
USERS_FILE = os.path.join(DATA_FOLDER, 'users.json')
JOBS_FILE = os.path.join(DATA_FOLDER, 'jobs.json')
APPLICATIONS_FILE = os.path.join(DATA_FOLDER, 'applications.json')

# Ensure data directory and files exist
os.makedirs(DATA_FOLDER, exist_ok=True)

def init_json_file(file_path, default_data=[]):
    """Initialize JSON file if it doesn't exist"""
    if not os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(default_data, f, indent=2, ensure_ascii=False)

# Initialize all data files
init_json_file(USERS_FILE, [])
init_json_file(JOBS_FILE, [])
init_json_file(APPLICATIONS_FILE, [])

@app.route('/api')
def home():
    return jsonify({'message': 'BotBoss API is running!'})

@app.route('/api/signup', methods=['POST'])
def signup():
    # Signup logic here
    pass

@app.route('/api/login', methods=['POST'])
def login():
    # Login logic here
    pass

# Add more routes as needed

if __name__ == '__main__':
    app.run(debug=True, port=5000)
