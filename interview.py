from flask import Blueprint, request, jsonify
from datetime import datetime
import json
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

interview_bp = Blueprint('interview', __name__)

# Data paths
DATA_FOLDER = 'data'
INTERVIEWS_FILE = os.path.join(DATA_FOLDER, 'interviews.json')
JOBS_FILE = os.path.join(DATA_FOLDER, 'jobs.json')
AUDIO_FOLDER = os.path.join(DATA_FOLDER, 'recordings')

os.makedirs(DATA_FOLDER, exist_ok=True)
os.makedirs(AUDIO_FOLDER, exist_ok=True)

if not os.path.exists(INTERVIEWS_FILE):
    with open(INTERVIEWS_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f, indent=2)

def read_interviews():
    try:
        with open(INTERVIEWS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def write_interviews(interviews):
    with open(INTERVIEWS_FILE, 'w', encoding='utf-8') as f:
        json.dump(interviews, f, indent=2, ensure_ascii=False)

def read_jobs():
    try:
        with open(JOBS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

# ---------------- START INTERVIEW ----------------
@interview_bp.route('/start', methods=['POST'])
def start_interview():
    try:
        data = request.json
        application_id = data.get('applicationId')
        job_id = data.get('jobId')
        candidate_name = data.get('candidateName')

        jobs = read_jobs()
        job = next((j for j in jobs if j['id'] == job_id), None)

        if not job:
            return jsonify({'error': 'Job not found'}), 404

        prompt = f"""
You are conducting a professional interview for the job: {job['title']}
Job Description: {job['description']}

Ask ONE short opening interview question.
"""

        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.7
        )

        first_question = response.choices[0].message.content.strip()

        interview_id = f"int_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        new_interview = {
            'id': interview_id,
            'applicationId': application_id,
            'jobId': job_id,
            'jobTitle': job['title'],
            'candidateName': candidate_name,
            'startedAt': datetime.now().isoformat(),
            'status': 'in_progress',
            'currentQuestion': 1,
            'totalQuestions': 5,
            'qa_pairs': [
                {
                    'questionNumber': 1,
                    'question': first_question,
                    'answer': None,
                    'timestamp': datetime.now().isoformat()
                }
            ]
        }

        interviews = read_interviews()
        interviews.append(new_interview)
        write_interviews(interviews)

        return jsonify({
            'success': True,
            'interviewId': interview_id,
            'question': first_question,
            'questionNumber': 1,
            'totalQuestions': 5
        }), 200

    except Exception as e:
        print("Start interview error:", e)
        return jsonify({'error': 'Interview start failed'}), 500


# ---------------- SUBMIT ANSWER ----------------
@interview_bp.route('/submit-answer', methods=['POST'])
def submit_answer():
    try:
        interview_id = request.form.get('interviewId')
        question_number = int(request.form.get('questionNumber'))
        audio_file = request.files.get('audio')

        if not audio_file:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_filename = f"{interview_id}_q{question_number}.webm"
        audio_path = os.path.join(AUDIO_FOLDER, audio_filename)
        audio_file.save(audio_path)

        with open(audio_path, "rb") as audio:
            transcript = client.audio.transcriptions.create(
                model="gpt-4o-transcribe",
                file=audio
            )

        answer_text = transcript.text

        interviews = read_interviews()
        interview = next((i for i in interviews if i['id'] == interview_id), None)

        if not interview:
            return jsonify({'error': 'Interview not found'}), 404

        for qa in interview['qa_pairs']:
            if qa['questionNumber'] == question_number:
                qa['answer'] = answer_text
                qa['audioPath'] = audio_path
                break

        if question_number >= interview['totalQuestions']:
            interview['status'] = 'completed'
            interview['completedAt'] = datetime.now().isoformat()
            write_interviews(interviews)

            return jsonify({
                'success': True,
                'isComplete': True,
                'message': 'Interview completed successfully!'
            }), 200

        job = next((j for j in read_jobs() if j['id'] == interview['jobId']), None)

        conversation = [
            {"role": "system", "content": f"""
You are conducting a professional interview for: {job['title']}
Job Description: {job['description']}

Ask the next relevant interview question based on previous answers.
Ask ONLY one question.
"""}
        ]

        for qa in interview['qa_pairs']:
            if qa['answer']:
                conversation.append({"role": "assistant", "content": qa['question']})
                conversation.append({"role": "user", "content": qa['answer']})

        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=conversation,
            temperature=0.7
        )

        next_question = response.choices[0].message.content.strip()
        next_question_number = question_number + 1

        interview['qa_pairs'].append({
            'questionNumber': next_question_number,
            'question': next_question,
            'answer': None,
            'timestamp': datetime.now().isoformat()
        })

        interview['currentQuestion'] = next_question_number
        write_interviews(interviews)

        return jsonify({
            'success': True,
            'question': next_question,
            'questionNumber': next_question_number,
            'totalQuestions': interview['totalQuestions'],
            'isComplete': False
        }), 200

    except Exception as e:
        print("Submit answer error:", e)
        return jsonify({'error': 'Submit answer failed'}), 500


# ---------------- GET INTERVIEW ----------------
@interview_bp.route('/<interview_id>', methods=['GET'])
def get_interview(interview_id):
    interviews = read_interviews()
    interview = next((i for i in interviews if i['id'] == interview_id), None)
    if not interview:
        return jsonify({'error': 'Interview not found'}), 404
    return jsonify(interview), 200


# ---------------- COMPANY INTERVIEWS ----------------
@interview_bp.route('/company/<company_id>', methods=['GET'])
def get_company_interviews(company_id):
    jobs = read_jobs()
    company_job_ids = [j['id'] for j in jobs if str(j.get('companyId')) == str(company_id)]

    interviews = read_interviews()
    company_interviews = [i for i in interviews if i['jobId'] in company_job_ids]

    return jsonify(company_interviews), 200
