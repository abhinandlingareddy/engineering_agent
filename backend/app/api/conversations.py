import uuid
import os
import tempfile
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime
from ..models.conversations import ConversationDB, ConversationCreate
from ..services.speech_service import SpeechToTextFactory
from ..services.storage_service import AzureBlobStorageService
from ..models.conversations import ConversationResponse, ConversationsResponse
from ..db.session import get_db

router = APIRouter()
speech_service = SpeechToTextFactory.create_provider("azure")
storage_service = AzureBlobStorageService()

@router.get("/", response_model=ConversationsResponse)
def get_conversations(db: Session = Depends(get_db)):
    """Get all conversations"""
    conversations = db.query(ConversationDB).order_by(ConversationDB.created_at.desc()).all()
    return {
        "success": True,
        "data": conversations
    }

@router.get("/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Get a specific conversation"""
    conversation = db.query(ConversationDB).filter(ConversationDB.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {
        "success": True,
        "data": conversation
    }

@router.post("/", response_model=ConversationResponse)
def create_conversation(
    conversation_data: ConversationCreate, 
    db: Session = Depends(get_db)
):
    """Create a new conversation"""
    new_conversation = ConversationDB(
        id=str(uuid.uuid4()),
        title=conversation_data.title
    )
    
    db.add(new_conversation)
    db.commit()
    db.refresh(new_conversation)
    
    return {
        "success": True,
        "data": new_conversation,
        "message": "Conversation created successfully"
    }

@router.post("/{conversation_id}/audio", response_model=ConversationResponse)
async def upload_conversation_audio(
    conversation_id: str, 
    audio_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload and process audio for a conversation"""
    conversation = db.query(ConversationDB).filter(ConversationDB.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Save the uploaded file to a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
    try:
        # Write the audio data to the temp file
        content = await audio_file.read()
        with open(temp_file.name, "wb") as f:
            f.write(content)
        
        # Upload to blob storage
        with open(temp_file.name, "rb") as f:
            storage_service.upload_audio(conversation_id, f)
        
        # Convert audio to text using Azure Speech Services
        transcription = speech_service.transcribe_audio_file(temp_file.name)
        
        # Calculate approximate duration (we could extract exact duration from audio file)
        duration = len(transcription.split()) / 2  # Rough approximation: 2 words per second
        
        # Update the conversation with transcription
        conversation.content = transcription
        conversation.duration = int(duration)
        conversation.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(conversation)
        
        return {
            "success": True,
            "data": conversation,
            "message": "Audio processed successfully"
        }
    finally:
        # Clean up the temporary file
        os.unlink(temp_file.name)

@router.delete("/{conversation_id}", response_model=ConversationResponse)
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Delete a conversation"""
    conversation = db.query(ConversationDB).filter(ConversationDB.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db.delete(conversation)
    db.commit()
    
    return {
        "success": True,
        "data": conversation,
        "message": "Conversation deleted successfully"
    }
