
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    department: str
    role: str = "employee"

class UserLogin(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    id: int
    role: str

# User Schemas ke andar
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Ticket Schemas ke andar
class TicketResponse(BaseModel):
    id: int
    user_id: int
    description: str
    category: str
    status: str
    created_at: datetime
    class Config:
        from_attributes = True  # 🔥 Aur yahan change kiya

# Ticket Schemas
class TicketCreate(BaseModel):
    user_id: int
    description: str
    category: str
    priority: str



# AI Suggestion Schema
class TicketSuggestionRequest(BaseModel):
    description: str


class TicketResolve(BaseModel):
    status: str = "Resolved"
    resolution_text: Optional[str] = None
    admin_id: Optional[int] = None

class KnowledgeBaseItem(BaseModel):
    ticket_id: int
    description: str
    resolution: str