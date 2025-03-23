import uuid
import os
import tempfile
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime
from ..models.conversations import ConversationDB, ConversationCreate
from ..services.speech_service import SpeechToTextFactory
from ..services.storage_service import AzureBlobStorageService
from ..models.conversations import ConversationResponse, ConversationsResponse
from ..db.session import get_db

# Configure logging with more details
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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
        title=conversation_data.title,
        content=""  # Explicitly set content to empty string
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
    logger.info(f"Received audio upload request for conversation_id: {conversation_id}")
    logger.info(f"Audio file details - Filename: {audio_file.filename or 'unnamed'}, Content-Type: {audio_file.content_type}")
    
    conversation = db.query(ConversationDB).filter(ConversationDB.id == conversation_id).first()
    if not conversation:
        logger.error(f"Conversation not found: {conversation_id}")
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Determine appropriate file extension based on the content type
    extension = ".webm"
    if audio_file.content_type:
        if "wav" in audio_file.content_type:
            extension = ".wav"
        elif "mp3" in audio_file.content_type:
            extension = ".mp3"
        elif "ogg" in audio_file.content_type:
            extension = ".ogg"
        logger.info(f"Using file extension: {extension} based on content-type: {audio_file.content_type}")
    
    # Save the uploaded file to a temporary file
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=extension)
    try:
        # Write the audio data to the temp file
        content = await audio_file.read()
        logger.info(f"Read audio file content, size: {len(content)} bytes")
        
        with open(temp_file.name, "wb") as f:
            f.write(content)
        logger.info(f"Audio saved to temporary file: {temp_file.name}")
        
        # Debug: List the first few bytes to check for proper audio formatting
        with open(temp_file.name, "rb") as f:
            header = f.read(16)
            logger.info(f"File header (first 16 bytes): {' '.join(f'{b:02x}' for b in header)}")
        
        # Upload to blob storage
        try:
            with open(temp_file.name, "rb") as f:
                storage_service.upload_audio(conversation_id, f)
            logger.info(f"Audio uploaded to blob storage for conversation_id: {conversation_id}")
        except Exception as e:
            logger.error(f"Failed to upload to blob storage: {str(e)}")
            # Continue with transcription even if storage fails
        
        # Convert audio to text using Azure Speech Services
        logger.info(f"Starting audio transcription from file: {temp_file.name}")
        try:
            transcription = speech_service.transcribe_audio_file(temp_file.name)
            logger.info(f"Transcription completed. Text length: {len(transcription)}")
            if transcription:
                logger.debug(f"Transcription text: {transcription[:100]}...")  # Log first 100 chars
            else:
                logger.warning("Transcription returned empty result")
        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to transcribe audio: {str(e)}")
        
        # Calculate approximate duration (we could extract exact duration from audio file)
        words = transcription.split() if transcription else []
        duration = len(words) / 2 if words else 0  # Rough approximation: 2 words per second
        logger.info(f"Calculated duration: {int(duration)} seconds based on {len(words)} words")
        
        # Update the conversation with transcription
        try:
            conversation.content = transcription or ""
            conversation.duration = int(duration)
            conversation.updated_at = datetime.utcnow()
            
            db.commit()
            logger.info(f"Database updated for conversation_id: {conversation_id}")
            db.refresh(conversation)
        except Exception as e:
            logger.error(f"Database update failed: {str(e)}", exc_info=True)
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to save conversation: {str(e)}")
        
        logger.info(f"Audio processing completed successfully for conversation_id: {conversation_id}")
        return {
            "success": True,
            "data": conversation,
            "message": "Audio processed successfully"
        }
    except Exception as e:
        logger.error(f"Unexpected error processing audio: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary file
        try:
            os.unlink(temp_file.name)
            logger.info(f"Temporary file removed: {temp_file.name}")
        except Exception as e:
            logger.warning(f"Failed to remove temporary file: {str(e)}")

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
