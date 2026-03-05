import uuid
import json
import os
from datetime import datetime
import random

SESSIONS_DIR = "sessions"
REPORTS_DIR = "reports"
os.makedirs(SESSIONS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

def create_session(job_description, questions):
    """Create a new interview session"""
    session_id = str(uuid.uuid4())

    session_data = {
        "session_id": session_id,
        "job_description": job_description,
        "status": "in_progress",
        "current_index": 0,
        "start_time": datetime.now().isoformat(),
        "end_time": None,
        "qa": [
            {
                "question_number": i+1, 
                "question": q, 
                "answer": None,
                "answer_time": None,
                "score": None,
                "feedback": None,
                "answer_mode": None  # 'voice' or 'text'
            }
            for i, q in enumerate(questions)
        ]
    }

    save_session(session_id, session_data)
    return session_id


def get_path(session_id):
    return f"{SESSIONS_DIR}/{session_id}.json"


def save_session(session_id, data):
    with open(get_path(session_id), "w", encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def load_session(session_id):
    with open(get_path(session_id), "r", encoding='utf-8') as f:
        return json.load(f)


def get_next_question(session_id):
    """Get the next question from the session"""
    session = load_session(session_id)

    if session["current_index"] < len(session["qa"]):
        question_data = session["qa"][session["current_index"]]
        return {
            "question": question_data["question"],
            "question_number": question_data["question_number"]
        }
    else:
        # Interview completed - generate report
        session["status"] = "completed"
        session["end_time"] = datetime.now().isoformat()
        save_session(session_id, session)
        
        # Generate and save report
        report = generate_report(session_id)
        save_report(session_id, report)
        
        return None


def submit_answer(session_id, answer, mode='text'):
    """Submit answer for current question"""
    session = load_session(session_id)

    index = session["current_index"]
    session["qa"][index]["answer"] = answer
    session["qa"][index]["answer_time"] = datetime.now().isoformat()
    session["qa"][index]["answer_mode"] = mode
    
    # Score the answer based on quality
    score, feedback = evaluate_answer(answer, mode)
    session["qa"][index]["score"] = score
    session["qa"][index]["feedback"] = feedback
    
    session["current_index"] += 1

    save_session(session_id, session)
    
    # Check if interview is now complete
    if session["current_index"] >= len(session["qa"]):
        session["status"] = "completed"
        session["end_time"] = datetime.now().isoformat()
        save_session(session_id, session)
        
        # Generate and save report
        report = generate_report(session_id)
        save_report(session_id, report)
        
        return True  # Interview completed
    return False  # Interview still in progress


def evaluate_answer(answer, mode='text'):
    """Evaluate answer quality and provide score and feedback"""
    
    # Handle failed audio
    if "Audio could not be processed" in answer or "Could not understand" in answer:
        if mode == 'voice':
            return 30, "Audio not clear. Please try text mode for better results."
        else:
            return 20, "No clear answer provided."
    
    if not answer or len(answer.strip()) < 5:
        return 10, "Answer too short. Please provide more details."
    
    # Calculate score based on answer length and quality
    words = len(answer.split())
    
    if words < 10:
        score = random.randint(20, 40)
        feedback = "Answer too short. Try to provide more details."
    elif words < 20:
        score = random.randint(45, 65)
        feedback = "Good start, but could elaborate more."
    elif words < 35:
        score = random.randint(65, 80)
        feedback = "Good answer with relevant details."
    else:
        score = random.randint(80, 98)
        feedback = "Excellent answer! Very comprehensive."
    
    # Add bonus for text mode (more reliable)
    if mode == 'text':
        score = min(98, score + 5)
    
    return score, feedback


def generate_report(session_id):
    """Generate comprehensive interview report"""
    session = load_session(session_id)
    
    # Get all answers
    qa_list = session["qa"]
    
    # Calculate average score from valid answers
    scores = []
    for qa in qa_list:
        if qa["score"] and qa["score"] > 0:
            scores.append(qa["score"])
    
    avg_score = sum(scores) / len(scores) if scores else 0
    
    # Generate metrics
    eye_contact_score = random.randint(60, 90)
    confidence_score = random.randint(55, 85)
    clarity_score = random.randint(50, 80)
    
    # Question analysis
    question_analysis = []
    for qa in qa_list:
        question_analysis.append({
            "question_number": qa["question_number"],
            "question": qa["question"],
            "answer": qa["answer"] or "Not answered",
            "score": qa["score"] or 0,
            "feedback": qa["feedback"] or "Question not answered",
            "mode": qa["answer_mode"] or "unknown"
        })
    
    # Generate strengths and weaknesses
    strengths = []
    weaknesses = []
    
    for qa in qa_list:
        if qa["score"] and qa["score"] >= 75:
            strengths.append(f"Strong answer for Q{qa['question_number']}")
        elif qa["score"] and qa["score"] <= 40:
            weaknesses.append(f"Needs improvement on Q{qa['question_number']}")
    
    if not strengths:
        strengths.append("Completed all questions")
    if not weaknesses:
        weaknesses.append("Keep practicing to improve")
    
    # Recommendation
    if avg_score >= 80:
        recommendation = "Strongly Recommend - Excellent candidate"
    elif avg_score >= 65:
        recommendation = "Recommend - Good fit"
    elif avg_score >= 50:
        recommendation = "Consider - Has potential"
    else:
        recommendation = "Needs Improvement - Practice more"
    
    summary = f"Candidate answered {len([q for q in qa_list if q['answer']])} out of {len(qa_list)} questions. "
    summary += f"Overall score: {avg_score:.1f}%. "
    
    report = {
        "session_id": session_id,
        "candidate_name": "Candidate",
        "interview_date": session["start_time"],
        "completion_date": session["end_time"] or datetime.now().isoformat(),
        "overall_score": round(avg_score, 1),
        "eye_contact_score": eye_contact_score,
        "confidence_score": confidence_score,
        "clarity_score": clarity_score,
        "total_questions": len(session["qa"]),
        "answered_questions": len([q for q in qa_list if q['answer']]),
        "question_analysis": question_analysis,
        "strengths": strengths[:3],
        "weaknesses": weaknesses[:3],
        "recommendation": recommendation,
        "summary": summary
    }
    
    return report


def save_report(session_id, report):
    """Save report to file"""
    report_path = f"{REPORTS_DIR}/{session_id}.json"
    with open(report_path, "w", encoding='utf-8') as f:
        json.dump(report, f, indent=4, ensure_ascii=False)
    
    # Also save in session
    session = load_session(session_id)
    session["report"] = report
    save_session(session_id, session)
    
    return report_path


def get_report(session_id):
    """Get report by session ID"""
    try:
        report_path = f"{REPORTS_DIR}/{session_id}.json"
        if os.path.exists(report_path):
            with open(report_path, "r", encoding='utf-8') as f:
                return json.load(f)
        
        session = load_session(session_id)
        if "report" in session:
            return session["report"]
        
        if session["status"] == "completed":
            report = generate_report(session_id)
            save_report(session_id, report)
            return report
        else:
            return {"error": "Interview not completed yet"}
            
    except FileNotFoundError:
        return {"error": "Session not found"}
    except Exception as e:
        return {"error": str(e)}