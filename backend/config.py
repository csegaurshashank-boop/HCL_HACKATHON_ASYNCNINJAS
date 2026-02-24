import os
from dotenv import load_dotenv

# Yeh line sabse important hai .env ko read karne ke liye!
load_dotenv() 

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
DATABASE_URL = "sqlite:///./it_tickets.db"

# JWT CONFIG
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-secret-key") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

