"""
app/routers/chat.py
- RAG-based chat endpoints for "Ask the News" functionality.
- Provides explainable Q&A with source citations and provenance.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import logging

from ..core.db import get_db
from ..services.rag_chat import create_rag_chat_system

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatRequest(BaseModel):
    question: str
    conversation_id: Optional[str] = None
    user_id: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    provenance: Dict[str, Any]
    conversation_id: Optional[str]
    query_id: str
    timestamp: str

@router.post("/ask", response_model=ChatResponse)
def ask_question(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """Ask a question about recent news using RAG."""
    try:
        # Create RAG chat system
        rag_system = create_rag_chat_system(db)
        
        # Process the question
        response = rag_system.ask_question(
            question=request.question,
            user_id=request.user_id,
            conversation_id=request.conversation_id,
            filters=request.filters
        )
        
        return ChatResponse(**response)
        
    except Exception as e:
        logger.error(f"Chat question processing failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process your question. Please try again."
        )

@router.get("/conversation/{conversation_id}/history")
def get_conversation_history(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """Get conversation history for a specific conversation."""
    try:
        rag_system = create_rag_chat_system(db)
        history = rag_system.get_conversation_history(conversation_id)
        
        return {
            "conversation_id": conversation_id,
            "messages": history,
            "message_count": len(history)
        }
        
    except Exception as e:
        logger.error(f"Conversation history fetch failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve conversation history."
        )

@router.post("/conversation/start")
def start_conversation(
    user_id: str = Query(..., description="User ID to start conversation for"),
    db: Session = Depends(get_db)
):
    """Start a new conversation."""
    try:
        rag_system = create_rag_chat_system(db)
        conversation_id = rag_system.conversation_manager.start_conversation(user_id)
        
        return {
            "conversation_id": conversation_id,
            "user_id": user_id,
            "started_at": rag_system.conversation_manager.conversations[conversation_id]["started_at"]
        }
        
    except Exception as e:
        logger.error(f"Conversation start failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to start conversation."
        )
