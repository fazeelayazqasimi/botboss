from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
from interview import interview_bp

app = Flask(__name__)
CORS(app)  # Allow all origins for development

app.register_blueprint(interview_bp, url_prefix='/api/interview')

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

def read_json_file(file_path):
    """Read data from JSON file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []

def write_json_file(file_path, data):
    """Write data to JSON file"""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        return True
    except Exception as e:
        print(f"Error writing to {file_path}: {str(e)}")
        return False

def read_users():
    """Read users from JSON file"""
    return read_json_file(USERS_FILE)

def write_users(users):
    """Write users to JSON file"""
    return write_json_file(USERS_FILE, users)

def read_jobs():
    """Read jobs from JSON file"""
    return read_json_file(JOBS_FILE)

def write_jobs(jobs):
    """Write jobs to JSON file"""
    return write_json_file(JOBS_FILE, jobs)

def read_applications():
    """Read applications from JSON file"""
    return read_json_file(APPLICATIONS_FILE)

def write_applications(applications):
    """Write applications to JSON file"""
    return write_json_file(APPLICATIONS_FILE, applications)

@app.route('/')
def home():
    return jsonify({
        'message': 'BotBoss API is running!',
        'endpoints': {
            'signup': '/api/signup (POST)',
            'login': '/api/login (POST)',
            'users': '/api/users (GET)',
            'jobs': '/api/jobs (GET, POST)',
            'applications': '/api/applications (GET, POST)',
            'company_jobs': '/api/company/<company_id>/jobs (GET)',
            'company_applications': '/api/company/<company_id>/applications (GET)'
        }
    })

@app.route('/api/signup', methods=['POST'])
def signup():
    """Handle user signup"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('name') or not data.get('email') or not data.get('password') or not data.get('role'):
            return jsonify({'error': 'Name, email, password aur role zaroori hain!'}), 400
        
        # Validate role
        if data.get('role') not in ['seeker', 'company']:
            return jsonify({'error': 'Role sirf "seeker" ya "company" ho sakta hai!'}), 400
        
        # Company-specific validation
        if data.get('role') == 'company' and not data.get('companyName'):
            return jsonify({'error': 'Company name zaroori hai!'}), 400
        
        # Read existing users
        users = read_users()
        
        # Check if user already exists
        if any(user['email'] == data['email'] for user in users):
            return jsonify({'error': 'Ye email pehle se registered hai!'}), 400
        
        # Create new user with unique ID
        user_id = f"user_{datetime.now().strftime('%Y%m%d%H%M%S')}_{len(users) + 1}"
        new_user = {
            'id': user_id,
            'name': data['name'],
            'email': data['email'],
            'password': data['password'],  # Note: In production, hash the password!
            'role': data['role'],
            'created_at': datetime.now().isoformat()
        }
        
        # Add company-specific fields if role is company
        if data.get('role') == 'company':
            new_user['companyName'] = data.get('companyName')
            new_user['website'] = data.get('website', '')
        
        # Add user to list
        users.append(new_user)
        
        # Save to file
        write_users(users)
        
        # Prepare response user object
        response_user = {
            'id': new_user['id'],
            'name': new_user['name'],
            'email': new_user['email'],
            'role': new_user['role']
        }
        
        # Add company fields if applicable
        if new_user.get('role') == 'company':
            response_user['companyName'] = new_user.get('companyName')
            response_user['website'] = new_user.get('website')
        
        return jsonify({
            'message': 'Account successfully ban gaya!',
            'user': response_user
        }), 201
        
    except Exception as e:
        print(f"Signup error: {str(e)}")
        return jsonify({'error': 'Server error! Kuch galat ho gaya.'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.json
        
        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email aur Password zaroori hain!'}), 400
        
        # Read users
        users = read_users()
        
        # Find user with matching credentials
        user = next(
            (u for u in users if u['email'] == data['email'] and u['password'] == data['password']),
            None
        )
        
        if user:
            # Prepare response user object
            response_user = {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user.get('role', 'seeker')
            }
            
            # Add company fields if role is company
            if user.get('role') == 'company':
                response_user['companyName'] = user.get('companyName', '')
                response_user['website'] = user.get('website', '')
            
            return jsonify({
                'message': 'Login successful!',
                'user': response_user
            }), 200
        else:
            return jsonify({'error': 'Email ya Password galat hai!'}), 401
            
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'Server error! Kuch galat ho gaya.'}), 500

# JOBS API ENDPOINTS

@app.route('/api/jobs', methods=['GET'])
def get_all_jobs():
    """Get all jobs (for homepage and seekers)"""
    try:
        jobs = read_jobs()
        # Filter only active jobs for public viewing
        active_jobs = [job for job in jobs if job.get('status', 'active') == 'active']
        return jsonify(active_jobs), 200
    except Exception as e:
        print(f"Get jobs error: {str(e)}")
        return jsonify({'error': 'Failed to fetch jobs'}), 500

@app.route('/api/jobs', methods=['POST'])
def create_job():
    """Create a new job posting"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['title', 'description', 'location', 'type', 'salary', 'companyId', 'companyName']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} zaroori hai!'}), 400
        
        # Read existing jobs
        jobs = read_jobs()
        
        # Create new job
        job_id = f"job_{datetime.now().strftime('%Y%m%d%H%M%S')}_{len(jobs) + 1}"
        new_job = {
            'id': job_id,
            'title': data['title'],
            'description': data['description'],
            'requirements': data.get('requirements', ''),
            'location': data['location'],
            'type': data['type'],
            'salary': data['salary'],
            'questions': data.get('questions', ''),
            'status': 'active',
            'postedDate': datetime.now().isoformat(),
            'companyId': data['companyId'],
            'companyName': data['companyName'],
            'applicants': 0,
            'updated_at': datetime.now().isoformat()
        }
        
        # Add to jobs list
        jobs.append(new_job)
        
        # Save to file
        write_jobs(jobs)
        
        return jsonify({
            'message': 'Job successfully posted!',
            'job': new_job
        }), 201
        
    except Exception as e:
        print(f"Create job error: {str(e)}")
        return jsonify({'error': 'Failed to create job'}), 500

@app.route('/api/jobs/<job_id>', methods=['PUT'])
def update_job(job_id):
    """Update a job"""
    try:
        data = request.json
        
        # Read existing jobs
        jobs = read_jobs()
        
        # Find job
        job_index = next((i for i, job in enumerate(jobs) if job['id'] == job_id), -1)
        
        if job_index == -1:
            return jsonify({'error': 'Job not found'}), 404
        
        # Update job
        jobs[job_index].update({
            'title': data.get('title', jobs[job_index]['title']),
            'description': data.get('description', jobs[job_index]['description']),
            'requirements': data.get('requirements', jobs[job_index]['requirements']),
            'location': data.get('location', jobs[job_index]['location']),
            'type': data.get('type', jobs[job_index]['type']),
            'salary': data.get('salary', jobs[job_index]['salary']),
            'questions': data.get('questions', jobs[job_index]['questions']),
            'status': data.get('status', jobs[job_index]['status']),
            'updated_at': datetime.now().isoformat()
        })
        
        # Save to file
        write_jobs(jobs)
        
        return jsonify({
            'message': 'Job updated successfully!',
            'job': jobs[job_index]
        }), 200
        
    except Exception as e:
        print(f"Update job error: {str(e)}")
        return jsonify({'error': 'Failed to update job'}), 500

@app.route('/api/jobs/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a job"""
    try:
        # Read existing jobs
        jobs = read_jobs()
        
        # Find job
        job_index = next((i for i, job in enumerate(jobs) if job['id'] == job_id), -1)
        
        if job_index == -1:
            return jsonify({'error': 'Job not found'}), 404
        
        # Remove job
        deleted_job = jobs.pop(job_index)
        
        # Save to file
        write_jobs(jobs)
        
        # Also delete associated applications
        applications = read_applications()
        applications = [app for app in applications if app.get('jobId') != job_id]
        write_applications(applications)
        
        return jsonify({
            'message': 'Job deleted successfully!',
            'job': deleted_job
        }), 200
        
    except Exception as e:
        print(f"Delete job error: {str(e)}")
        return jsonify({'error': 'Failed to delete job'}), 500

# COMPANY SPECIFIC ENDPOINTS

@app.route('/api/company/<company_id>/jobs', methods=['GET'])
@app.route('/api/company/<company_id>/jobs', methods=['GET'])
def get_company_jobs(company_id):
    """Get all jobs posted by a specific company"""
    try:
        print(f"🔍 Request for company_id: {company_id}")
        print(f"🔍 Type of company_id: {type(company_id)}")
        
        jobs = read_jobs()
        print(f"📊 Total jobs in database: {len(jobs)}")
        
        company_jobs = [job for job in jobs if str(job.get('companyId')) == str(company_id)]
        print(f"🏢 Company jobs found: {len(company_jobs)}")
        
        # Debug: Print all jobs with companyId
        for job in jobs:
            print(f"  Job: {job.get('title')} - CompanyID: {job.get('companyId')}")
        
        return jsonify(company_jobs), 200
    except Exception as e:
        print(f"❌ Get company jobs error: {str(e)}")
        return jsonify({'error': 'Failed to fetch company jobs'}), 500

@app.route('/api/company/<company_id>/applications', methods=['GET'])
def get_company_applications(company_id):
    """Get all applications for a company's jobs"""
    try:
        # First, get all jobs posted by this company
        jobs = read_jobs()
        company_job_ids = [job['id'] for job in jobs if job.get('companyId') == company_id]
        
        # Then get applications for these jobs
        applications = read_applications()
        company_applications = [
            app for app in applications 
            if app.get('jobId') in company_job_ids
        ]
        
        return jsonify(company_applications), 200
    except Exception as e:
        print(f"Get company applications error: {str(e)}")
        return jsonify({'error': 'Failed to fetch company applications'}), 500

# APPLICATIONS API ENDPOINTS

@app.route('/api/applications', methods=['GET'])
def get_all_applications():
    """Get all applications (for admin use)"""
    try:
        applications = read_applications()
        return jsonify(applications), 200
    except Exception as e:
        print(f"Get applications error: {str(e)}")
        return jsonify({'error': 'Failed to fetch applications'}), 500

@app.route('/api/applications', methods=['POST'])
def create_application():
    """Create a new job application"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['jobId', 'jobTitle', 'candidateName', 'candidateEmail']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} zaroori hai!'}), 400
        
        # Check if job exists
        jobs = read_jobs()
        job = next((j for j in jobs if j['id'] == data['jobId']), None)
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Check if job is active
        if job.get('status') != 'active':
            return jsonify({'error': 'This job is no longer accepting applications'}), 400
        
        # Read existing applications
        applications = read_applications()
        
        # Check if already applied
        if any(app['jobId'] == data['jobId'] and app['candidateEmail'] == data['candidateEmail'] 
               for app in applications):
            return jsonify({'error': 'You have already applied for this job'}), 400
        
        # Create new application
        app_id = f"app_{datetime.now().strftime('%Y%m%d%H%M%S')}_{len(applications) + 1}"
        new_application = {
            'id': app_id,
            'jobId': data['jobId'],
            'jobTitle': data['jobTitle'],
            'candidateName': data['candidateName'],
            'candidateEmail': data['candidateEmail'],
            'resumeUrl': data.get('resumeUrl', ''),
            'additionalInfo': data.get('additionalInfo', ''),
            'appliedDate': datetime.now().isoformat(),
            'status': 'pending',
            'updated_at': datetime.now().isoformat()
        }
        
        # Add to applications list
        applications.append(new_application)
        
        # Update job applicants count
        job_index = next((i for i, j in enumerate(jobs) if j['id'] == data['jobId']), -1)
        if job_index != -1:
            jobs[job_index]['applicants'] = jobs[job_index].get('applicants', 0) + 1
            jobs[job_index]['updated_at'] = datetime.now().isoformat()
            write_jobs(jobs)
        
        # Save to file
        write_applications(applications)
        
        return jsonify({
            'message': 'Application submitted successfully!',
            'application': new_application
        }), 201
        
    except Exception as e:
        print(f"Create application error: {str(e)}")
        return jsonify({'error': 'Failed to submit application'}), 500

@app.route('/api/applications/<app_id>', methods=['PUT'])
def update_application(app_id):
    """Update application status"""
    try:
        data = request.json
        
        # Read existing applications
        applications = read_applications()
        
        # Find application
        app_index = next((i for i, app in enumerate(applications) if app['id'] == app_id), -1)
        
        if app_index == -1:
            return jsonify({'error': 'Application not found'}), 404
        
        # Update application
        applications[app_index].update({
            'status': data.get('status', applications[app_index]['status']),
            'notes': data.get('notes', applications[app_index].get('notes', '')),
            'updated_at': datetime.now().isoformat()
        })
        
        # Save to file
        write_applications(applications)
        
        return jsonify({
            'message': 'Application updated successfully!',
            'application': applications[app_index]
        }), 200
        
    except Exception as e:
        print(f"Update application error: {str(e)}")
        return jsonify({'error': 'Failed to update application'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users (for testing only - remove in production!)"""
    users = read_users()
    # Remove passwords from response
    safe_users = [{
        'id': u['id'],
        'name': u['name'],
        'email': u['email'],
        'role': u.get('role', 'seeker'),
        'companyName': u.get('companyName', '') if u.get('role') == 'company' else None,
        'created_at': u.get('created_at', 'N/A')
    } for u in users]
    return jsonify(safe_users), 200

@app.route('/api/test', methods=['GET'])
def test():
    """Test endpoint"""
    return jsonify({
        'status': 'Server chal raha hai!',
        'data_files': {
            'users': USERS_FILE,
            'jobs': JOBS_FILE,
            'applications': APPLICATIONS_FILE
        },
        'file_exists': {
            'users': os.path.exists(USERS_FILE),
            'jobs': os.path.exists(JOBS_FILE),
            'applications': os.path.exists(APPLICATIONS_FILE)
        }
    }), 200

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 BotBoss Backend Server Starting...")
    print("=" * 50)
    print(f"📁 Data will be saved in folder: {os.path.abspath(DATA_FOLDER)}")
    print(f"📄 Data files:")
    print(f"   - Users: {os.path.abspath(USERS_FILE)}")
    print(f"   - Jobs: {os.path.abspath(JOBS_FILE)}")
    print(f"   - Applications: {os.path.abspath(APPLICATIONS_FILE)}")
    print(f"🌐 Server running on: http://127.0.0.1:5000")
    print(f"📝 API Endpoints:")
    print(f"   - POST http://127.0.0.1:5000/api/jobs (Post new job)")
    print(f"   - GET  http://127.0.0.1:5000/api/jobs (Get all jobs)")
    print(f"   - GET  http://127.0.0.1:5000/api/company/<id>/jobs (Company jobs)")
    print(f"   - POST http://127.0.0.1:5000/api/applications (Apply for job)")
    print(f"   - GET  http://127.0.0.1:5000/api/company/<id>/applications (Company apps)")
    print("=" * 50)
    print()
    
    app.run(debug=True, port=5000, host='localhost')