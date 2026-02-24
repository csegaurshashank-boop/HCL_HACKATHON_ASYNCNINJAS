from sqlalchemy.orm import Session
import models, schemas
from auth import get_password_hash
from sqlalchemy import func

def create_ticket(db: Session, ticket: schemas.TicketCreate):
    # Task 2: Auto-Escalation logic
    status = "Open"
    if ticket.priority == "High":
        status = "Escalated"
        
    db_ticket = models.Ticket(
        user_id=ticket.user_id,
        description=ticket.description,
        category=ticket.category,
        priority=ticket.priority,
        status=status
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        name=user.name,
        email=user.email,
        password=get_password_hash(user.password),
        department=user.department,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_all_tickets(db: Session):
    # Admin ke liye saari tickets laane ka function
    return db.query(models.Ticket).all()

def get_user_tickets(db: Session, user_id: int):
    # Specific user ki tickets fetch karne ke liye
    return db.query(models.Ticket).filter(models.Ticket.user_id == user_id).all()

def resolve_ticket(db: Session, ticket_id: int, resolve_data: schemas.TicketResolve):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if ticket:
        ticket.status = resolve_data.status
        # Agar admin ne koi final resolution text diya hai, toh usko save karo
        if resolve_data.resolution_text:
            res = models.Resolution(
                ticket_id=ticket_id,
                admin_id=resolve_data.admin_id,
                resolution_text=resolve_data.resolution_text
            )
            db.add(res)
        db.commit()
        db.refresh(ticket)
    return ticket

def get_analytics(db: Session):
    total_tickets = db.query(models.Ticket).count()
    resolved_tickets = db.query(models.Ticket).filter(models.Ticket.status == "Resolved").count()
    open_tickets = total_tickets - resolved_tickets
    
    # Category wise ticket count (Most Common Issues)
    categories = db.query(models.Ticket.category, func.count(models.Ticket.id)).group_by(models.Ticket.category).order_by(func.count(models.Ticket.id).desc()).all()
    
    # Simple Resolution Rate
    resolution_rate = (resolved_tickets / total_tickets * 100) if total_tickets > 0 else 0
    
    return {
        "total_tickets": total_tickets,
        "resolved": resolved_tickets,
        "open": open_tickets,
        "resolution_rate": f"{resolution_rate:.2f}%",
        "categories": [{"category": c[0], "count": c[1]} for c in categories]
    }