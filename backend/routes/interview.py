from fastapi import APIRouter, HTTPException, UploadFile, File, status
from pydantic import BaseModel
import os
import logging
from typing import Optional, List, Dict, Any
import uuid

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from services.ai_engine import generate_questions
from services.interview_manager import (
    create_session,
    get_next_question,
    submit_answer,
    load_session,
    get_report
)
from services.speech_to_text import transcribe_audio

router = APIRouter()

os.makedirs("temp_audio", exist_ok=True)


class InterviewStart(BaseModel):
    job_description: str


@router.post("/start", status_code=status.HTTP_200_OK)
async def start_interview(data: InterviewStart):
    """Start a new interview session"""
    logger.info(f"Starting interview...")
    
    try:
        questions = generate_questions(data.job_description)
        logger.info(f"Generated {len(questions)} questions")

        session_id = create_session(data.job_description, questions)
        logger.info(f"Created session: {session_id}")

        return {
            "session_id": session_id,
            "questions_count": len(questions),
            "message": "Interview started successfully"
        }
    
    except Exception as e:
        logger.error(f"Error starting interview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/next/{session_id}")
async def next_question(session_id: str):
    """Get next question"""
    logger.info(f"Getting next question for session: {session_id}")
    
    try:
        question_data = get_next_question(session_id)

        if question_data:
            session = load_session(session_id)
            return {
                "question": question_data["question"],
                "question_number": question_data["question_number"],
                "total_questions": len(session["qa"]),
                "status": "in_progress"
            }
        else:
            session = load_session(session_id)
            return {
                "message": "Interview Completed",
                "session_id": session_id,
                "status": "completed",
                "total_questions": len(session["qa"])
            }
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Session not found")
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/voice-answer/{session_id}")
async def voice_answer(session_id: str, file: UploadFile = File(...)):
    """Submit voice answer"""
    logger.info(f"Receiving answer for session: {session_id}")
    
    try:
        # Check if this is a text file (from text mode)
        mode = 'text' if file.filename.endswith('.txt') else 'voice'
        
        if mode == 'text':
            # Text mode
            content = await file.read()
            transcript = content.decode('utf-8')
            logger.info(f"Received text answer: {transcript[:50]}...")
        else:
            # Voice mode - save audio file
            file_extension = os.path.splitext(file.filename)[1]
            if not file_extension:
                file_extension = ".webm"
            
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = f"temp_audio/{unique_filename}"
            
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            
            logger.info(f"Saved audio file: {file_path}, size: {len(content)} bytes")

            # Transcribe audio
            transcript = transcribe_audio(file_path)
            
            # Clean up
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except:
                pass

        # Submit answer with mode
        completed = submit_answer(session_id, transcript, mode)
        
        # Get session info
        session = load_session(session_id)
        current_index = session["current_index"]
        total = len(session["qa"])
        
        if completed:
            return {
                "message": "Interview Completed",
                "transcript": transcript,
                "session_id": session_id,
                "completed": True,
                "mode": mode
            }
        else:
            return {
                "message": "Answer Saved",
                "transcript": transcript,
                "session_id": session_id,
                "completed": False,
                "current_question": current_index,
                "total_questions": total,
                "mode": mode
            }
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/report/{session_id}")
async def get_interview_report(session_id: str):
    """Get interview report"""
    logger.info(f"Getting report for session: {session_id}")
    
    try:
        report = get_report(session_id)
        
        if "error" in report:
            raise HTTPException(status_code=404, detail=report["error"])
        
        return report
    
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Report not found")
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))