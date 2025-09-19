"""
app/routers/multimodal.py
- Multimodal content processing endpoints.
- Handles TTS generation, video clips, and media analysis.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import logging
import tempfile
import os
from pathlib import Path

from ..core.db import get_db
from ..services.multimodal import multimodal_processor

logger = logging.getLogger(__name__)
router = APIRouter()

class TTSRequest(BaseModel):
    text: str
    language: str = "en"
    speed: float = 1.0
    voice_style: str = "default"

class SocialClipRequest(BaseModel):
    article_id: str
    duration: int = 15

class MediaAnalysisResponse(BaseModel):
    images: List[Dict[str, Any]]
    videos: List[Dict[str, Any]]
    audio_briefing: Dict[str, Any]
    social_clip: Dict[str, Any]
    processed_at: str

@router.post("/tts/generate")
def generate_tts(
    request: TTSRequest,
    db: Session = Depends(get_db)
):
    """Generate TTS audio from text."""
    try:
        audio_file = multimodal_processor.audio_generator.generate_tts_briefing(
            text=request.text,
            language=request.language,
            speed=request.speed,
            voice_style=request.voice_style
        )
        
        if not audio_file or not os.path.exists(audio_file):
            raise HTTPException(
                status_code=500,
                detail="Failed to generate audio file"
            )
        
        return FileResponse(
            audio_file,
            media_type="audio/mpeg",
            filename=f"tts_{Path(audio_file).stem}.mp3"
        )
        
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate TTS audio"
        )

@router.post("/briefing/create/{article_id}")
def create_micro_briefing(
    article_id: str,
    db: Session = Depends(get_db)
):
    """Create audio micro-briefing for an article."""
    try:
        # Get article data
        from sqlalchemy import text
        query = text("""
            SELECT a.id, a.title, a.author, a.source_url,
                   an.summary
            FROM articles a
            LEFT JOIN article_nlp an ON a.id = an.article_id
            WHERE a.id = :article_id
        """)
        
        result = db.execute(query, {"article_id": article_id}).first()
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail="Article not found"
            )
        
        article_data = {
            "id": result.id,
            "title": result.title,
            "author": result.author,
            "source": result.source_url,
            "summary": result.summary
        }
        
        # Generate micro-briefing
        briefing = multimodal_processor.audio_generator.create_micro_briefing(article_data)
        
        if not briefing or not briefing.get("audio_file"):
            raise HTTPException(
                status_code=500,
                detail="Failed to create audio briefing"
            )
        
        return {
            "article_id": article_id,
            "audio_url": f"/multimodal/audio/{Path(briefing['audio_file']).name}",
            "duration": briefing.get("duration", 0),
            "script": briefing.get("script", ""),
            "generated_at": briefing.get("generated_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Micro-briefing creation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create micro-briefing"
        )

@router.post("/social-clip/create", response_model=Dict[str, Any])
def create_social_clip(
    request: SocialClipRequest,
    db: Session = Depends(get_db)
):
    """Create social media clip for an article."""
    try:
        # Get article data
        from sqlalchemy import text
        query = text("""
            SELECT a.id, a.title, a.subtitle,
                   an.summary
            FROM articles a
            LEFT JOIN article_nlp an ON a.id = an.article_id
            WHERE a.id = :article_id
        """)
        
        result = db.execute(query, {"article_id": request.article_id}).first()
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail="Article not found"
            )
        
        article_data = {
            "title": result.title,
            "subtitle": result.subtitle,
            "summary": result.summary
        }
        
        # Generate social clip
        clip_data = multimodal_processor.social_clip_generator.create_social_clip(
            article_data, duration=request.duration
        )
        
        if not clip_data or not clip_data.get("video_file"):
            raise HTTPException(
                status_code=500,
                detail="Failed to create social clip"
            )
        
        return {
            "article_id": request.article_id,
            "video_url": f"/multimodal/video/{Path(clip_data['video_file']).name}",
            "duration": clip_data.get("duration", request.duration),
            "created_at": clip_data.get("created_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Social clip creation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create social clip"
        )

@router.post("/analyze/image")
async def analyze_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Analyze uploaded image."""
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Analyze image
        analysis = multimodal_processor.image_processor.analyze_image(tmp_file_path)
        
        # Clean up temp file
        os.unlink(tmp_file_path)
        
        return {
            "filename": file.filename,
            "analysis": analysis
        }
        
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze image"
        )

@router.post("/analyze/video")
async def analyze_video(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Analyze uploaded video."""
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Analyze video
        analysis = multimodal_processor.video_processor.analyze_video(tmp_file_path)
        
        # Clean up temp file
        os.unlink(tmp_file_path)
        
        return {
            "filename": file.filename,
            "analysis": analysis
        }
        
    except Exception as e:
        logger.error(f"Video analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze video"
        )

@router.post("/process/article/{article_id}", response_model=MediaAnalysisResponse)
def process_article_media(
    article_id: str,
    db: Session = Depends(get_db)
):
    """Process all media for an article."""
    try:
        # Get article data
        from sqlalchemy import text
        query = text("""
            SELECT a.id, a.title, a.subtitle, a.body_text,
                   an.summary, an.credibility_score
            FROM articles a
            LEFT JOIN article_nlp an ON a.id = an.article_id
            WHERE a.id = :article_id
        """)
        
        result = db.execute(query, {"article_id": article_id}).first()
        
        if not result:
            raise HTTPException(
                status_code=404,
                detail="Article not found"
            )
        
        article_data = {
            "id": result.id,
            "title": result.title,
            "subtitle": result.subtitle,
            "body_text": result.body_text,
            "summary": result.summary,
            "credibility_score": result.credibility_score
        }
        
        # Process media (no media files for now, but generates audio/video)
        media_results = multimodal_processor.process_article_media(article_data)
        
        return MediaAnalysisResponse(**media_results)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Article media processing failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process article media"
        )

@router.get("/audio/{filename}")
def serve_audio(filename: str):
    """Serve generated audio files."""
    # In production, this would be served by CDN/S3
    audio_path = Path(tempfile.gettempdir()) / filename
    
    if not audio_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Audio file not found"
        )
    
    return FileResponse(
        audio_path,
        media_type="audio/mpeg",
        filename=filename
    )

@router.get("/video/{filename}")
def serve_video(filename: str):
    """Serve generated video files."""
    # In production, this would be served by CDN/S3
    video_path = Path(tempfile.gettempdir()) / filename
    
    if not video_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Video file not found"
        )
    
    return FileResponse(
        video_path,
        media_type="video/mp4",
        filename=filename
    )
