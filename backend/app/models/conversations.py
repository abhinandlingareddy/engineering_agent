from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ConversationDB(Base):
    __tablename__ = "conversations"
    
    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    duration = Column(Integer, default=0)  # duration in seconds
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ConversationBase(BaseModel):
    title: str
    
class ConversationCreate(ConversationBase):
    pass

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    duration: Optional[int] = None

class Conversation(ConversationBase):
    id: str
    content: str = ""
    duration: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class ConversationResponse(BaseModel):
    success: bool
    data: Conversation
    message: Optional[str] = None

class ConversationsResponse(BaseModel):
    success: bool
    data: List[Conversation]
    message: Optional[str] = None
