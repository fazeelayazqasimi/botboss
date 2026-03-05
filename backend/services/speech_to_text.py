import speech_recognition as sr
import os
import uuid
import logging
import subprocess
import wave
import contextlib

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def transcribe_audio(file_path):
    """
    Convert audio file to text using Google Speech Recognition
    Handles multiple audio formats
    """
    logger.info(f"Transcribing audio file: {file_path}")
    
    # Check if file exists
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return "Audio file not found"
    
    # Check file size
    file_size = os.path.getsize(file_path)
    if file_size == 0:
        logger.error("Empty audio file")
        return "Empty audio file"
    
    logger.info(f"File size: {file_size} bytes")
    
    # If it's a text file (from text mode), just read it
    if file_path.endswith('.txt'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read().strip()
                if text:
                    logger.info(f"Read text from file: {text[:50]}...")
                    return text
                else:
                    return "Empty text"
        except Exception as e:
            logger.error(f"Error reading text file: {e}")
            return "Could not read text file"
    
    # For audio files, try multiple methods
    return transcribe_audio_multiformat(file_path)


def transcribe_audio_multiformat(file_path):
    """Try multiple methods to transcribe audio"""
    
    # Method 1: Direct speech recognition (works for WAV)
    result = transcribe_direct(file_path)
    if result and "Could not understand" not in result and "failed" not in result.lower():
        return result
    
    # Method 2: Try to convert with FFmpeg if available
    result = transcribe_with_ffmpeg(file_path)
    if result and "Could not understand" not in result and "failed" not in result.lower():
        return result
    
    # Method 3: Last resort - return helpful message
    return "Audio could not be processed. Please use text mode or ensure clear audio."


def transcribe_direct(file_path):
    """Try direct transcription (works best with WAV)"""
    recognizer = sr.Recognizer()
    
    try:
        with sr.AudioFile(file_path) as source:
            # Adjust for ambient noise
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            
            # Record audio
            audio = recognizer.record(source)
            
            # Recognize speech
            text = recognizer.recognize_google(audio)
            logger.info(f"Direct transcription successful: '{text[:50]}...'")
            return text
            
    except sr.UnknownValueError:
        logger.warning("Could not understand audio in direct mode")
        return None
    except sr.RequestError as e:
        logger.error(f"Speech recognition service error: {e}")
        return None
    except Exception as e:
        logger.error(f"Direct transcription error: {e}")
        return None


def transcribe_with_ffmpeg(file_path):
    """Convert with FFmpeg then transcribe"""
    recognizer = sr.Recognizer()
    wav_path = f"temp_audio/{uuid.uuid4()}.wav"
    
    try:
        # Check if FFmpeg is available
        try:
            subprocess.run(["ffmpeg", "-version"], 
                         capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            logger.warning("FFmpeg not installed, skipping conversion")
            return None
        
        # Convert to WAV with specific parameters
        logger.info(f"Converting {file_path} to WAV")
        result = subprocess.run([
            "ffmpeg",
            "-y",
            "-i", file_path,
            "-acodec", "pcm_s16le",
            "-ac", "1",
            "-ar", "16000",
            "-f", "wav",
            wav_path
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            logger.error(f"FFmpeg conversion failed: {result.stderr}")
            return None
        
        # Check if converted file exists and has content
        if not os.path.exists(wav_path) or os.path.getsize(wav_path) == 0:
            logger.error("Converted file is empty or missing")
            return None
        
        # Transcribe the converted WAV
        with sr.AudioFile(wav_path) as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio = recognizer.record(source)
            text = recognizer.recognize_google(audio)
            
        logger.info(f"FFmpeg transcription successful: '{text[:50]}...'")
        return text
        
    except sr.UnknownValueError:
        logger.warning("Could not understand audio after conversion")
        return None
    except Exception as e:
        logger.error(f"FFmpeg transcription error: {e}")
        return None
    finally:
        # Clean up
        try:
            if os.path.exists(wav_path):
                os.remove(wav_path)
        except:
            pass