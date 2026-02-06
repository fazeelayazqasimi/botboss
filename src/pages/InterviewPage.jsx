import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './InterviewPage.css';

const InterviewPage = () => {
  const { applicationId, jobId } = useParams();
  const navigate = useNavigate();
  
  const [interviewId, setInterviewId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [stream, setStream] = useState(null);
  
  // Face Detection States
  const [faceDetected, setFaceDetected] = useState(true);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [isCheating, setIsCheating] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const faceDetectionInterval = useRef(null);

  // Start interview on page load
  useEffect(() => {
    startInterview();
    setupWebcam();
    
    return () => {
      // Cleanup webcam on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (faceDetectionInterval.current) {
        clearInterval(faceDetectionInterval.current);
      }
    };
  }, []);

  // Start face detection when recording starts
  useEffect(() => {
    if (isRecording) {
      startFaceDetection();
    } else {
      if (faceDetectionInterval.current) {
        clearInterval(faceDetectionInterval.current);
      }
    }
  }, [isRecording]);

  const setupWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Load face detection model after video loads
      videoRef.current.onloadedmetadata = () => {
        loadFaceDetectionModel();
      };
    } catch (error) {
      console.error('Webcam access error:', error);
      alert('Please allow camera and microphone access!');
    }
  };

  const loadFaceDetectionModel = async () => {
    try {
      // Load face-api.js models
      await Promise.all([
        window.faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        window.faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        window.faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
      console.log('Face detection models loaded');
    } catch (error) {
      console.error('Error loading face detection models:', error);
    }
  };

  const startFaceDetection = () => {
    // Check face every 1 second during recording
    faceDetectionInterval.current = setInterval(async () => {
      await detectFace();
    }, 1000);
  };

  const detectFace = async () => {
    if (!videoRef.current || !window.faceapi) return;

    try {
      const detections = await window.faceapi
        .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      if (detections) {
        // Face detected
        const landmarks = detections.landmarks;
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        
        // Check if face is straight (looking at camera)
        const isFaceStraight = checkIfFaceStraight(nose, leftEye, rightEye);
        
        if (isFaceStraight) {
          setFaceDetected(true);
          setShowWarning(false);
        } else {
          handleFaceWarning('Please look directly at the camera');
        }
      } else {
        // No face detected
        handleFaceWarning('Face not detected! Please stay in frame');
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }
  };

  const checkIfFaceStraight = (nose, leftEye, rightEye) => {
    // Calculate eye center
    const leftEyeCenter = getCenter(leftEye);
    const rightEyeCenter = getCenter(rightEye);
    const noseCenter = getCenter(nose);
    
    // Calculate horizontal alignment
    const eyeMidpointX = (leftEyeCenter.x + rightEyeCenter.x) / 2;
    const horizontalDiff = Math.abs(noseCenter.x - eyeMidpointX);
    
    // Calculate vertical alignment (eye level)
    const eyeLevelDiff = Math.abs(leftEyeCenter.y - rightEyeCenter.y);
    
    // Threshold for "straight" face (adjust as needed)
    const isHorizontallyStraight = horizontalDiff < 20;
    const isVerticallyStraight = eyeLevelDiff < 15;
    
    return isHorizontallyStraight && isVerticallyStraight;
  };

  const getCenter = (points) => {
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { x, y };
  };

  const handleFaceWarning = (message) => {
    setFaceDetected(false);
    setWarningMessage(message);
    setShowWarning(true);
    
    const newWarningCount = warningCount + 1;
    setWarningCount(newWarningCount);
    
    // Auto-hide warning after 2 seconds
    setTimeout(() => {
      setShowWarning(false);
    }, 2000);
    
    // If warnings exceed limit, terminate interview
    if (newWarningCount >= 5) {
      handleCheatingDetected();
    }
  };

  const handleCheatingDetected = () => {
    setIsCheating(true);
    
    // Stop recording if active
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    // Stop face detection
    if (faceDetectionInterval.current) {
      clearInterval(faceDetectionInterval.current);
    }
    
    alert('⚠️ Interview terminated due to suspicious activity!\n\nYou looked away from the camera too many times.');
    
    // Redirect back to dashboard after 2 seconds
    setTimeout(() => {
      navigate('/seeker-dashboard');
    }, 2000);
  };

  const startInterview = async () => {
    try {
      setIsProcessing(true);
      const user = JSON.parse(localStorage.getItem('user'));
      
      const response = await fetch('http://localhost:5000/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          jobId,
          candidateName: user?.name || 'Candidate'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setInterviewId(data.interviewId);
        setCurrentQuestion(data.question);
        setQuestionNumber(data.questionNumber);
        setTotalQuestions(data.totalQuestions);
      }
    } catch (error) {
      console.error('Start interview error:', error);
      alert('Failed to start interview!');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = () => {
    if (!stream) {
      alert('Camera not ready!');
      return;
    }

    if (isCheating) {
      alert('Interview has been terminated!');
      return;
    }

    chunksRef.current = [];
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      await submitAnswer(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    setWarningCount(0); // Reset warning count for new recording
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop face detection
      if (faceDetectionInterval.current) {
        clearInterval(faceDetectionInterval.current);
      }
    }
  };

  const submitAnswer = async (audioBlob) => {
    try {
      setIsProcessing(true);

      const formData = new FormData();
      formData.append('interviewId', interviewId);
      formData.append('questionNumber', questionNumber);
      formData.append('audio', audioBlob, 'answer.wav');

      const response = await fetch('http://localhost:5000/api/interview/submit-answer', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        if (data.isComplete) {
          setIsComplete(true);
        } else {
          setCurrentQuestion(data.question);
          setQuestionNumber(data.questionNumber);
        }
      }
    } catch (error) {
      console.error('Submit answer error:', error);
      alert('Failed to submit answer!');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCheating) {
    return (
      <div className="interview-container">
        <div className="interview-terminated">
          <div className="terminated-icon">⚠️</div>
          <h1>Interview Terminated</h1>
          <p>Your interview has been terminated due to suspicious activity.</p>
          <p className="reason">Reason: Looking away from camera multiple times</p>
          <p className="note">Please maintain eye contact with the camera during interviews.</p>
          <button onClick={() => navigate('/seeker-dashboard')} className="btn-primary">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="interview-container">
        <div className="interview-complete">
          <h1>🎉 Interview Complete!</h1>
          <p>Thank you for completing the interview.</p>
          <p>We will review your responses and get back to you soon.</p>
          <button onClick={() => navigate('/seeker-dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-container">
      {/* Warning Overlay */}
      {showWarning && (
        <div className="warning-overlay">
          <div className="warning-box">
            <div className="warning-icon">⚠️</div>
            <p className="warning-text">{warningMessage}</p>
            <p className="warning-count">Warning {warningCount}/5</p>
          </div>
        </div>
      )}

      <div className="interview-header">
        <div>
          <h1>AI Interview</h1>
          <p>Question {questionNumber} of {totalQuestions}</p>
        </div>
        
        <div className="monitoring-status">
          <div className={`status-indicator ${faceDetected ? 'status-good' : 'status-warning'}`}>
            <div className="status-dot"></div>
            <span>{faceDetected ? 'Face Detected' : 'Face Not Detected'}</span>
          </div>
          {warningCount > 0 && (
            <div className="warning-badge">
              ⚠️ Warnings: {warningCount}/5
            </div>
          )}
        </div>
      </div>

      <div className="interview-content">
        <div className="question-box">
          <h2>Question:</h2>
          <p>{currentQuestion || 'Loading question...'}</p>
        </div>

        <div className="video-section">
          <div className="video-wrapper">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="webcam-feed"
            />
            <canvas ref={canvasRef} className="face-overlay" />
            
            {/* Face detection indicator */}
            <div className={`face-indicator ${faceDetected ? 'indicator-good' : 'indicator-bad'}`}>
              {faceDetected ? '✓ Looking Good' : '✗ Look at Camera'}
            </div>
          </div>
        </div>

        <div className="controls">
          {!isRecording && !isProcessing && (
            <button onClick={startRecording} className="btn-record">
              🎤 Start Recording
            </button>
          )}

          {isRecording && (
            <div className="recording-controls">
              <div className="recording-indicator">
                <div className="recording-dot"></div>
                <span>Recording...</span>
              </div>
              <button onClick={stopRecording} className="btn-stop">
                ⏹️ Stop & Submit
              </button>
            </div>
          )}

          {isProcessing && (
            <p className="processing-text">⏳ Processing your answer...</p>
          )}
        </div>

        <div className="interview-tips">
          <h3>Important Guidelines:</h3>
          <ul>
            <li>👁️ Maintain eye contact with the camera</li>
            <li>🎯 Keep your face centered in the frame</li>
            <li>🔊 Speak clearly and confidently</li>
            <li>⏱️ Take 30-60 seconds per answer</li>
            <li>⚠️ Looking away will result in warnings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;