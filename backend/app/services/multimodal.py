"""
app/services/multimodal.py
- Multimodal content processing: images, videos, audio generation.
- Handles OCR, image analysis, video keyframes, TTS generation.
"""
from typing import Dict, Any, List, Optional, Tuple
import logging
import os
import tempfile
import hashlib
from datetime import datetime
from pathlib import Path

# Image processing
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import pytesseract
import imagehash

# Audio processing
from gtts import gTTS
from pydub import AudioSegment
import librosa

# Video processing
from moviepy.editor import VideoFileClip, ImageClip, CompositeVideoClip, TextClip
import moviepy.config as mp_config

# ML models
from transformers import pipeline
import torch

logger = logging.getLogger(__name__)

class ImageProcessor:
    """Advanced image processing and analysis."""
    
    def __init__(self):
        self._load_models()
    
    def _load_models(self):
        """Load image analysis models."""
        try:
            # Image captioning model
            self.captioner = pipeline(
                "image-to-text",
                model="nlpconnect/vit-gpt2-image-captioning",
                device=0 if torch.cuda.is_available() else -1
            )
        except Exception as e:
            logger.warning(f"Failed to load image captioning model: {e}")
            self.captioner = None
    
    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """Comprehensive image analysis."""
        try:
            # Load image
            image = Image.open(image_path)
            cv_image = cv2.imread(image_path)
            
            # Basic metadata
            width, height = image.size
            file_size = os.path.getsize(image_path)
            
            # Generate perceptual hash for duplicate detection
            img_hash = str(imagehash.phash(image))
            
            # OCR text extraction
            ocr_text = pytesseract.image_to_string(image).strip()
            
            # Image captioning
            caption = self._generate_caption(image_path)
            
            # Detect faces and objects
            faces = self._detect_faces(cv_image)
            
            # Calculate image quality metrics
            quality_metrics = self._assess_image_quality(cv_image)
            
            # Detect if image contains text
            text_regions = self._detect_text_regions(cv_image)
            
            # Color analysis
            color_analysis = self._analyze_colors(image)
            
            return {
                "hash": img_hash,
                "width": width,
                "height": height,
                "file_size": file_size,
                "format": image.format,
                "ocr_text": ocr_text,
                "caption": caption,
                "faces_detected": len(faces),
                "face_regions": faces,
                "quality_metrics": quality_metrics,
                "text_regions": text_regions,
                "color_analysis": color_analysis,
                "salience_score": self._calculate_salience_score(cv_image),
                "processed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Image analysis failed for {image_path}: {e}")
            return self._empty_image_analysis()
    
    def _generate_caption(self, image_path: str) -> str:
        """Generate descriptive caption for image."""
        if not self.captioner:
            return ""
        
        try:
            result = self.captioner(image_path)
            return result[0]['generated_text'] if result else ""
        except Exception as e:
            logger.error(f"Image captioning failed: {e}")
            return ""
    
    def _detect_faces(self, cv_image: np.ndarray) -> List[Dict[str, int]]:
        """Detect faces in image."""
        try:
            # Load OpenCV face cascade
            face_cascade = cv2.CascadeClassifier(
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            )
            
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            
            return [
                {"x": int(x), "y": int(y), "width": int(w), "height": int(h)}
                for (x, y, w, h) in faces
            ]
        except Exception as e:
            logger.error(f"Face detection failed: {e}")
            return []
    
    def _assess_image_quality(self, cv_image: np.ndarray) -> Dict[str, float]:
        """Assess image quality metrics."""
        try:
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            
            # Sharpness (Laplacian variance)
            sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Brightness (mean pixel value)
            brightness = np.mean(gray)
            
            # Contrast (standard deviation)
            contrast = np.std(gray)
            
            return {
                "sharpness": float(sharpness),
                "brightness": float(brightness),
                "contrast": float(contrast)
            }
        except Exception as e:
            logger.error(f"Quality assessment failed: {e}")
            return {"sharpness": 0.0, "brightness": 0.0, "contrast": 0.0}
    
    def _detect_text_regions(self, cv_image: np.ndarray) -> List[Dict[str, int]]:
        """Detect text regions in image."""
        try:
            # Use EAST text detector or simple contour detection
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            
            # Apply threshold to get binary image
            _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Find contours
            contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            text_regions = []
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                # Filter by size to get potential text regions
                if w > 20 and h > 10 and w/h > 2:
                    text_regions.append({
                        "x": int(x), "y": int(y), 
                        "width": int(w), "height": int(h)
                    })
            
            return text_regions[:10]  # Return top 10 regions
            
        except Exception as e:
            logger.error(f"Text region detection failed: {e}")
            return []
    
    def _analyze_colors(self, image: Image.Image) -> Dict[str, Any]:
        """Analyze color distribution in image."""
        try:
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Get dominant colors
            colors = image.getcolors(maxcolors=256*256*256)
            if colors:
                # Sort by frequency
                colors.sort(key=lambda x: x[0], reverse=True)
                
                dominant_colors = []
                for count, color in colors[:5]:
                    dominant_colors.append({
                        "color": color,
                        "frequency": count,
                        "percentage": count / (image.width * image.height) * 100
                    })
                
                return {
                    "dominant_colors": dominant_colors,
                    "total_unique_colors": len(colors)
                }
            
            return {"dominant_colors": [], "total_unique_colors": 0}
            
        except Exception as e:
            logger.error(f"Color analysis failed: {e}")
            return {"dominant_colors": [], "total_unique_colors": 0}
    
    def _calculate_salience_score(self, cv_image: np.ndarray) -> float:
        """Calculate image salience/importance score."""
        try:
            # Simple salience based on edge density and color variance
            gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
            
            # Edge detection
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / edges.size
            
            # Color variance
            color_variance = np.var(cv_image)
            
            # Combine metrics (normalize to 0-1)
            salience = min(1.0, (edge_density * 10 + color_variance / 10000) / 2)
            
            return float(salience)
            
        except Exception as e:
            logger.error(f"Salience calculation failed: {e}")
            return 0.5
    
    def _empty_image_analysis(self) -> Dict[str, Any]:
        """Return empty image analysis structure."""
        return {
            "hash": "",
            "width": 0,
            "height": 0,
            "file_size": 0,
            "format": "",
            "ocr_text": "",
            "caption": "",
            "faces_detected": 0,
            "face_regions": [],
            "quality_metrics": {"sharpness": 0.0, "brightness": 0.0, "contrast": 0.0},
            "text_regions": [],
            "color_analysis": {"dominant_colors": [], "total_unique_colors": 0},
            "salience_score": 0.0,
            "processed_at": datetime.utcnow().isoformat()
        }

class VideoProcessor:
    """Video processing and keyframe extraction."""
    
    def analyze_video(self, video_path: str) -> Dict[str, Any]:
        """Analyze video and extract keyframes."""
        try:
            clip = VideoFileClip(video_path)
            
            # Basic metadata
            duration = clip.duration
            fps = clip.fps
            width, height = clip.size
            
            # Extract keyframes
            keyframes = self._extract_keyframes(clip, max_frames=5)
            
            # Audio analysis if present
            audio_analysis = {}
            if clip.audio:
                audio_analysis = self._analyze_audio(clip.audio)
            
            clip.close()
            
            return {
                "duration": duration,
                "fps": fps,
                "width": width,
                "height": height,
                "keyframes": keyframes,
                "audio_analysis": audio_analysis,
                "processed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Video analysis failed for {video_path}: {e}")
            return {
                "duration": 0,
                "fps": 0,
                "width": 0,
                "height": 0,
                "keyframes": [],
                "audio_analysis": {},
                "processed_at": datetime.utcnow().isoformat()
            }
    
    def _extract_keyframes(self, clip: VideoFileClip, max_frames: int = 5) -> List[Dict[str, Any]]:
        """Extract representative keyframes from video."""
        try:
            keyframes = []
            duration = clip.duration
            
            # Extract frames at regular intervals
            for i in range(max_frames):
                timestamp = (i + 1) * duration / (max_frames + 1)
                
                # Get frame at timestamp
                frame = clip.get_frame(timestamp)
                
                # Convert to PIL Image for analysis
                pil_image = Image.fromarray(frame.astype('uint8'))
                
                # Save frame temporarily for analysis
                with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
                    pil_image.save(tmp_file.name)
                    
                    # Analyze keyframe
                    image_processor = ImageProcessor()
                    frame_analysis = image_processor.analyze_image(tmp_file.name)
                    
                    keyframes.append({
                        "timestamp": timestamp,
                        "analysis": frame_analysis
                    })
                    
                    # Clean up temp file
                    os.unlink(tmp_file.name)
            
            return keyframes
            
        except Exception as e:
            logger.error(f"Keyframe extraction failed: {e}")
            return []
    
    def _analyze_audio(self, audio_clip) -> Dict[str, Any]:
        """Analyze audio track of video."""
        try:
            # Extract audio to temporary file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                audio_clip.write_audiofile(tmp_file.name, verbose=False, logger=None)
                
                # Load with librosa for analysis
                y, sr = librosa.load(tmp_file.name)
                
                # Basic audio features
                tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
                spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
                
                # Clean up temp file
                os.unlink(tmp_file.name)
                
                return {
                    "tempo": float(tempo),
                    "spectral_centroid_mean": float(np.mean(spectral_centroids)),
                    "duration": len(y) / sr
                }
                
        except Exception as e:
            logger.error(f"Audio analysis failed: {e}")
            return {}

class AudioGenerator:
    """Text-to-speech and audio content generation."""
    
    def generate_tts_briefing(self, text: str, language: str = 'en', 
                            speed: float = 1.0, voice_style: str = 'default') -> str:
        """Generate TTS audio briefing from text."""
        try:
            # Create TTS object
            tts = gTTS(text=text, lang=language, slow=(speed < 1.0))
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
                tts.save(tmp_file.name)
                
                # Apply audio processing if needed
                if speed != 1.0 and speed >= 1.0:
                    audio = AudioSegment.from_mp3(tmp_file.name)
                    # Speed up audio
                    faster_audio = audio.speedup(playback_speed=speed)
                    
                    # Save processed audio
                    processed_file = tmp_file.name.replace('.mp3', '_processed.mp3')
                    faster_audio.export(processed_file, format="mp3")
                    
                    # Clean up original
                    os.unlink(tmp_file.name)
                    
                    return processed_file
                
                return tmp_file.name
                
        except Exception as e:
            logger.error(f"TTS generation failed: {e}")
            return ""
    
    def create_micro_briefing(self, article_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a short audio briefing from article data."""
        try:
            # Create briefing script
            title = article_data.get('title', '')
            summary = article_data.get('summary', '')
            source = article_data.get('source', 'Unknown source')
            
            script = f"Here's your news briefing. {title}. {summary}. This report comes from {source}."
            
            # Generate audio
            audio_file = self.generate_tts_briefing(script)
            
            if audio_file:
                # Get audio duration
                audio = AudioSegment.from_mp3(audio_file)
                duration = len(audio) / 1000.0  # Convert to seconds
                
                return {
                    "audio_file": audio_file,
                    "duration": duration,
                    "script": script,
                    "generated_at": datetime.utcnow().isoformat()
                }
            
            return {}
            
        except Exception as e:
            logger.error(f"Micro briefing creation failed: {e}")
            return {}

class SocialClipGenerator:
    """Generate short social media clips from articles."""
    
    def create_social_clip(self, article_data: Dict[str, Any], 
                          duration: int = 15) -> Dict[str, Any]:
        """Create a short video clip for social media."""
        try:
            title = article_data.get('title', 'News Update')
            summary = article_data.get('summary', '')[:200]  # Limit length
            
            # Create background image
            background = self._create_background_image()
            
            # Create text clips
            title_clip = TextClip(title, fontsize=24, color='white', 
                                font='Arial-Bold').set_duration(duration)
            
            summary_clip = TextClip(summary, fontsize=16, color='white',
                                  font='Arial').set_duration(duration).set_start(2)
            
            # Compose video
            background_clip = ImageClip(background).set_duration(duration)
            
            final_clip = CompositeVideoClip([
                background_clip,
                title_clip.set_position(('center', 'top')),
                summary_clip.set_position(('center', 'center'))
            ])
            
            # Save video
            with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp_file:
                final_clip.write_videofile(tmp_file.name, verbose=False, logger=None)
                
                return {
                    "video_file": tmp_file.name,
                    "duration": duration,
                    "created_at": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            logger.error(f"Social clip generation failed: {e}")
            return {}
    
    def _create_background_image(self, width: int = 1080, height: int = 1080) -> str:
        """Create a simple background image."""
        try:
            # Create gradient background
            image = Image.new('RGB', (width, height), color='#1a1a2e')
            draw = ImageDraw.Draw(image)
            
            # Add gradient effect
            for y in range(height):
                color_value = int(26 + (y / height) * 30)  # Gradient from dark to slightly lighter
                draw.line([(0, y), (width, y)], fill=(color_value, color_value, 46))
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
                image.save(tmp_file.name)
                return tmp_file.name
                
        except Exception as e:
            logger.error(f"Background creation failed: {e}")
            return ""

class MultimodalProcessor:
    """Main multimodal processing coordinator."""
    
    def __init__(self):
        self.image_processor = ImageProcessor()
        self.video_processor = VideoProcessor()
        self.audio_generator = AudioGenerator()
        self.social_clip_generator = SocialClipGenerator()
    
    def process_article_media(self, article_data: Dict[str, Any], 
                            media_files: List[str] = None) -> Dict[str, Any]:
        """Process all media associated with an article."""
        results = {
            "images": [],
            "videos": [],
            "audio_briefing": {},
            "social_clip": {},
            "processed_at": datetime.utcnow().isoformat()
        }
        
        if media_files:
            for media_file in media_files:
                file_ext = Path(media_file).suffix.lower()
                
                if file_ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']:
                    # Process image
                    image_analysis = self.image_processor.analyze_image(media_file)
                    results["images"].append(image_analysis)
                
                elif file_ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm']:
                    # Process video
                    video_analysis = self.video_processor.analyze_video(media_file)
                    results["videos"].append(video_analysis)
        
        # Generate audio briefing
        if article_data.get('summary'):
            audio_briefing = self.audio_generator.create_micro_briefing(article_data)
            results["audio_briefing"] = audio_briefing
        
        # Generate social clip
        social_clip = self.social_clip_generator.create_social_clip(article_data)
        results["social_clip"] = social_clip
        
        return results

# Initialize the multimodal processor
multimodal_processor = MultimodalProcessor()
