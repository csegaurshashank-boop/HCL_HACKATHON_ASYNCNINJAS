from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String) # Hackathon demo ke liye simple string rakh lenge
    department = Column(String)
    role = Column(String, default="employee") # 'employee' or 'admin'

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    description = Column(Text)
    category = Column(String)
    priority = Column(String, default="Medium")
    status = Column(String, default="Open") # Open, Resolved, Closed
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Resolution(Base):
    __tablename__ = "resolutions"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    admin_id = Column(Integer, ForeignKey("users.id"))
    resolution_text = Column(Text)
    resolved_at = Column(DateTime(timezone=True), server_default=func.now())