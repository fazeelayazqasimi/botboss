from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import interview

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

app.include_router(interview.router, prefix="/interview", tags=["Interview"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the AI Interview Platform!"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "server": "running"}