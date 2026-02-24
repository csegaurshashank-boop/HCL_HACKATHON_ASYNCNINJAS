from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models, schemas, crud, nlp
from auth import verify_password, create_access_token, get_current_user
from database import SessionLocal, engine, Base
import csv
import os
import pandas as pd

# Create SQLite tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Aegis AI Ticket Engine")

# CORS setup so React frontend can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- AUTH ENDPOINTS ---

@app.post("/api/auth/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=user_data.email)
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# --- SPRINT 2 ENDPOINTS ---

@app.post("/api/tickets/suggest")
def suggest_resolution(request: schemas.TicketSuggestionRequest):
    """
    Frontend hits this the moment user types a description to get AI help.
    Returns suggested guide and top 3 past resolutions.
    """
    result = nlp.get_ai_suggestion(request.description)
    return result

@app.post("/api/tickets/raise", response_model=schemas.TicketResponse)
def create_new_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    """
    Saves the ticket to the SQLite Database.
    Automatically handles "Escalated" status if priority is high.
    """
    return crud.create_ticket(db=db, ticket=ticket)

@app.get("/api/admin/tickets", response_model=list[schemas.TicketResponse])
def get_all_tickets_for_admin(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Admin dashboard API to view all raised tickets.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_all_tickets(db)

@app.get("/api/users/{user_id}/tickets", response_model=list[schemas.TicketResponse])
def get_tickets_for_user(user_id: int, db: Session = Depends(get_db)):
    """
    User dashboard API to see their own history.
    """
    return crud.get_user_tickets(db=db, user_id=user_id)

@app.put("/api/tickets/{ticket_id}/resolve")
def resolve_ticket(ticket_id: int, resolve_data: schemas.TicketResolve, db: Session = Depends(get_db)):
    """Admin ya User ticket ko 'Resolved', 'In Progress', etc. mark karte hain"""
    ticket = crud.resolve_ticket(db, ticket_id, resolve_data)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"message": f"Ticket marked as {resolve_data.status} successfully", "ticket": ticket}

@app.get("/api/admin/analytics")
def get_analytics(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Admin dashboard ke liye live analytics"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_analytics(db)

@app.post("/api/admin/knowledge-base")
def add_to_knowledge_base(item: schemas.KnowledgeBaseItem, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    THE INNOVATION ENDPOINT:
    Nayi ticket aur uska solution CSV mein append karta hai aur SQL Database mein register karta hai.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    csv_path = os.path.join(os.path.dirname(__file__), "data", "tickets.csv")
    try:
        # 1. SQL Database mein Resolution entry create karna
        res = models.Resolution(
            ticket_id=item.ticket_id,
            admin_id=None, # System update
            resolution_text=item.resolution
        )
        db.add(res)
        db.commit()

        # 2. CSV mein append karna (NLP training ke liye)
        with open(csv_path, mode='a', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow([item.ticket_id, item.description, item.resolution])
        
        # Reloading NLP data
        nlp.df = pd.read_csv(csv_path)
        nlp.df.columns = nlp.df.columns.str.strip()
        
        return {"message": "Knowledge base updated in SQL & CSV. AI Engine Retrained Successfully!"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
