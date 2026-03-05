from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os
import logging
from dotenv import load_dotenv
import random

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_questions(job_description):
    """
    Generate interview questions based on job description
    Always tries AI first, falls back to template-based generation
    """
    
    # Try AI first
    ai_questions = try_ai_generation(job_description)
    if ai_questions and len(ai_questions) >= 5:
        logger.info(f"✅ AI generated {len(ai_questions)} questions")
        return ai_questions[:5]
    
    # If AI fails, generate dynamically from job description
    logger.warning("⚠️ AI generation failed, using dynamic template generation")
    return generate_dynamic_questions(job_description)


def try_ai_generation(job_description):
    """Try to generate questions using Google AI"""
    
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "YOUR_API_KEY":
        logger.warning("No valid Google API key found")
        return None
    
    try:
        logger.info("Attempting AI question generation...")
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.8,
            max_tokens=800
        )

        prompt = ChatPromptTemplate.from_template("""
        You are an expert technical interviewer at a top tech company.
        
        Based on the following job description, create 5 unique and challenging interview questions.
        
        JOB DESCRIPTION:
        {job_description}
        
        REQUIREMENTS:
        - Generate exactly 5 questions
        - Mix of technical and behavioral questions
        - Questions should be specific to this role
        - Make them challenging but fair
        - Each question should be on a new line
        - Do not number the questions
        - Do not add any additional text
        
        Return only the 5 questions, one per line.
        """)

        chain = prompt | llm | StrOutputParser()
        result = chain.invoke({"job_description": job_description})
        
        # Parse questions
        questions = []
        for line in result.strip().split('\n'):
            line = line.strip()
            if line and len(line) > 10 and '?' in line:
                # Remove any numbers if present
                if line[0].isdigit() and '.' in line:
                    line = line.split('.', 1)[1].strip()
                questions.append(line)
        
        logger.info(f"AI generated {len(questions)} questions")
        return questions if len(questions) >= 3 else None
        
    except Exception as e:
        logger.error(f"AI generation error: {str(e)}")
        return None


def generate_dynamic_questions(job_description):
    """
    Generate questions dynamically from job description without hardcoding
    Uses keyword extraction and templates
    """
    
    # Extract keywords from job description
    keywords = extract_keywords(job_description)
    logger.info(f"Extracted keywords: {keywords}")
    
    # Question templates based on keyword categories
    questions = []
    
    # Technical questions based on skills
    if keywords['technical']:
        for skill in keywords['technical'][:3]:
            questions.append(f"Can you describe your experience with {skill} and how you've applied it in real projects?")
            questions.append(f"What challenges have you faced while working with {skill} and how did you overcome them?")
    
    # Experience-based questions
    if keywords['experience']:
        for exp in keywords['experience'][:2]:
            questions.append(f"Tell me about a project where you used {exp}. What was your specific contribution?")
    
    # Role-specific questions
    if keywords['role']:
        for role in keywords['role'][:2]:
            questions.append(f"What interests you most about working as a {role}?")
            questions.append(f"How do you stay updated with the latest trends in {role}?")
    
    # Behavioral questions based on keywords
    if keywords['soft']:
        for soft in keywords['soft'][:2]:
            questions.append(f"Can you give an example of when you demonstrated {soft} in your work?")
    
    # Problem-solving questions
    questions.append("Describe a challenging technical problem you solved recently. What was your approach?")
    questions.append("How do you handle disagreements with team members about technical decisions?")
    
    # Project-based questions
    questions.append("Tell me about a project you're particularly proud of. What made it successful?")
    questions.append("How do you approach learning new technologies or frameworks?")
    
    # If we don't have enough questions, add general ones based on job context
    while len(questions) < 10:
        questions.extend(generate_contextual_questions(job_description))
    
    # Shuffle and take first 5 for variety
    random.shuffle(questions)
    return questions[:5]


def extract_keywords(text):
    """Extract different types of keywords from job description"""
    
    text_lower = text.lower()
    
    # Technical skills keywords
    tech_keywords = [
        'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node', 'express',
        'django', 'flask', 'fastapi', 'spring', 'sql', 'mysql', 'postgresql', 'mongodb',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'linux',
        'html', 'css', 'sass', 'typescript', 'redux', 'webpack', 'rest', 'graphql',
        'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch', 'pandas',
        'devops', 'ci/cd', 'terraform', 'ansible', 'prometheus', 'grafana'
    ]
    
    # Soft skills keywords
    soft_keywords = [
        'leadership', 'communication', 'teamwork', 'collaboration', 'problem-solving',
        'analytical', 'critical thinking', 'time management', 'adaptability', 'flexibility',
        'creativity', 'innovation', 'mentoring', 'presentation', 'negotiation'
    ]
    
    # Role keywords
    role_keywords = [
        'developer', 'engineer', 'architect', 'manager', 'lead', 'senior', 'junior',
        'full stack', 'frontend', 'backend', 'devops', 'data', 'ml', 'ai', 'cloud',
        'security', 'qa', 'tester', 'analyst', 'consultant'
    ]
    
    # Experience level keywords
    exp_keywords = [
        'years of experience', 'experienced', 'expert', 'proficient', 'familiar',
        'worked on', 'built', 'developed', 'designed', 'implemented', 'managed'
    ]
    
    extracted = {
        'technical': [],
        'soft': [],
        'role': [],
        'experience': []
    }
    
    # Extract technical skills
    for tech in tech_keywords:
        if tech in text_lower:
            extracted['technical'].append(tech)
    
    # Extract soft skills
    for soft in soft_keywords:
        if soft in text_lower:
            extracted['soft'].append(soft)
    
    # Extract roles
    for role in role_keywords:
        if role in text_lower:
            extracted['role'].append(role)
    
    # Extract experience indicators
    for exp in exp_keywords:
        if exp in text_lower:
            extracted['experience'].append(exp)
    
    # Remove duplicates
    for key in extracted:
        extracted[key] = list(set(extracted[key]))
    
    return extracted


def generate_contextual_questions(job_description):
    """Generate contextual questions based on job description analysis"""
    
    questions = []
    text_lower = job_description.lower()
    
    # Check for specific contexts
    if 'team' in text_lower or 'collaborate' in text_lower:
        questions.append("How do you prefer to collaborate with team members on technical projects?")
    
    if 'deadline' in text_lower or 'fast-paced' in text_lower:
        questions.append("How do you manage your time and prioritize tasks when working under tight deadlines?")
    
    if 'customer' in text_lower or 'client' in text_lower:
        questions.append("Can you describe your experience working directly with clients or customers?")
    
    if 'startup' in text_lower or 'fast-growing' in text_lower:
        questions.append("What attracts you to a fast-paced, growing environment?")
    
    if 'legacy' in text_lower or 'existing' in text_lower:
        questions.append("How do you approach working with or improving existing codebases?")
    
    if 'mentor' in text_lower or 'guide' in text_lower:
        questions.append("Do you have experience mentoring junior developers? What's your approach?")
    
    if 'agile' in text_lower or 'scrum' in text_lower:
        questions.append("What's your experience with Agile/Scrum methodologies?")
    
    if 'remote' in text_lower or 'distributed' in text_lower:
        questions.append("How do you stay productive and connected in a remote work environment?")
    
    # If no specific context found, add general questions
    if len(questions) < 3:
        questions.extend([
            "What attracted you to this position?",
            "Where do you see yourself professionally in the next few years?",
            "What's your approach to solving complex technical problems?",
            "How do you handle feedback on your work?",
            "What do you consider your greatest professional achievement?"
        ])
    
    return questions