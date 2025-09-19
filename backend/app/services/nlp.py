"""
app/services/nlp.py
- Advanced NLP pipeline: language detection, NER, sentiment, keyphrases, embeddings, summarization.
- Supports multilingual processing with spaCy, BERT, and specialized models.
"""
from typing import Dict, Any, List, Optional
import logging
import re
from datetime import datetime
import hashlib

# Core NLP libraries
import spacy
from langdetect import detect as lang_detect
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from sentence_transformers import SentenceTransformer
import yake
from rake_nltk import Rake
from simhash import Simhash
import nltk
from transformers import pipeline, AutoTokenizer, AutoModel
import torch

# Topic modeling
from bertopic import BERTopic
from sklearn.feature_extraction.text import CountVectorizer
from umap import UMAP
from hdbscan import HDBSCAN

# Image processing
import cv2
import pytesseract
from PIL import Image
import imagehash

logger = logging.getLogger(__name__)

class AdvancedNLPPipeline:
    def __init__(self):
        """Initialize all NLP models and pipelines."""
        self._load_models()
        self.vader_analyzer = SentimentIntensityAnalyzer()
        
    def _load_models(self):
        """Load all required models with error handling."""
        try:
            # Download required NLTK data
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            
            # Load spaCy models for multiple languages
            self.spacy_models = {}
            languages = ['en', 'es', 'fr', 'de']  # Add more as needed
            
            for lang in languages:
                try:
                    if lang == 'en':
                        self.spacy_models[lang] = spacy.load('en_core_web_sm')
                    elif lang == 'es':
                        self.spacy_models[lang] = spacy.load('es_core_news_sm')
                    elif lang == 'fr':
                        self.spacy_models[lang] = spacy.load('fr_core_news_sm')
                    elif lang == 'de':
                        self.spacy_models[lang] = spacy.load('de_core_news_sm')
                except OSError:
                    logger.warning(f"spaCy model for {lang} not found, using English fallback")
                    if 'en' in self.spacy_models:
                        self.spacy_models[lang] = self.spacy_models['en']
            
            # Fallback to English if no models loaded
            if not self.spacy_models:
                try:
                    self.spacy_models['en'] = spacy.load('en_core_web_sm')
                except OSError:
                    logger.error("No spaCy models available. Install with: python -m spacy download en_core_web_sm")
                    self.spacy_models['en'] = None
            
            # Load sentence transformer for embeddings
            try:
                self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                logger.error(f"Failed to load sentence transformer: {e}")
                self.sentence_model = None
            
            # Load summarization pipeline
            try:
                self.summarizer = pipeline("summarization", 
                                         model="facebook/bart-large-cnn",
                                         device=0 if torch.cuda.is_available() else -1)
            except Exception as e:
                logger.warning(f"Failed to load summarization model: {e}")
                self.summarizer = None
            
            # Initialize topic modeling (will be trained on demand)
            self.topic_model = None
            
        except Exception as e:
            logger.error(f"Error loading NLP models: {e}")

    def detect_language(self, text: str) -> str:
        """Detect language of the text."""
        try:
            return lang_detect(text)
        except:
            return 'en'  # Default to English

    def extract_entities(self, text: str, language: str = 'en') -> List[Dict[str, Any]]:
        """Extract named entities using spaCy."""
        if language not in self.spacy_models or not self.spacy_models[language]:
            language = 'en'
        
        nlp = self.spacy_models.get(language)
        if not nlp:
            return []
        
        try:
            doc = nlp(text)
            entities = []
            for ent in doc.ents:
                entities.append({
                    "text": ent.text,
                    "label": ent.label_,
                    "start": ent.start_char,
                    "end": ent.end_char,
                    "confidence": getattr(ent, 'confidence', 0.9)
                })
            return entities
        except Exception as e:
            logger.error(f"Entity extraction failed: {e}")
            return []

    def analyze_sentiment(self, text: str) -> Dict[str, float]:
        """Analyze sentiment using VADER."""
        try:
            scores = self.vader_analyzer.polarity_scores(text)
            return {
                "positive": scores['pos'],
                "negative": scores['neg'],
                "neutral": scores['neu'],
                "compound": scores['compound']
            }
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {"positive": 0.0, "negative": 0.0, "neutral": 1.0, "compound": 0.0}

    def extract_keyphrases(self, text: str, language: str = 'en') -> List[str]:
        """Extract keyphrases using YAKE and RAKE."""
        keyphrases = []
        
        try:
            # YAKE extraction
            kw_extractor = yake.KeywordExtractor(
                lan=language,
                n=3,  # n-gram size
                dedupLim=0.7,
                top=10
            )
            yake_keywords = kw_extractor.extract_keywords(text)
            keyphrases.extend([kw[1] for kw in yake_keywords])
            
            # RAKE extraction (English only)
            if language == 'en':
                rake = Rake()
                rake.extract_keywords_from_text(text)
                rake_keywords = rake.get_ranked_phrases()[:10]
                keyphrases.extend(rake_keywords)
            
            # Remove duplicates and return top 15
            return list(dict.fromkeys(keyphrases))[:15]
            
        except Exception as e:
            logger.error(f"Keyphrase extraction failed: {e}")
            return []

    def generate_embedding(self, text: str) -> List[float]:
        """Generate sentence embedding."""
        if not self.sentence_model:
            # Fallback to simple hash-based embedding
            return self._fallback_embedding(text)
        
        try:
            embedding = self.sentence_model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return self._fallback_embedding(text)

    def _fallback_embedding(self, text: str) -> List[float]:
        """Fallback embedding using hash-based approach."""
        # Create a more sophisticated hash-based embedding
        text_hash = hashlib.md5(text.encode()).hexdigest()
        embedding = []
        for i in range(0, len(text_hash), 2):
            val = int(text_hash[i:i+2], 16) / 255.0
            embedding.append(val)
        
        # Pad or truncate to 384 dimensions
        while len(embedding) < 384:
            embedding.extend(embedding[:min(len(embedding), 384 - len(embedding))])
        return embedding[:384]

    def summarize_text(self, text: str, max_length: int = 150) -> str:
        """Generate extractive and abstractive summaries."""
        if not text or len(text.split()) < 10:
            return text
        
        try:
            # Abstractive summarization with BART
            if self.summarizer and len(text.split()) > 50:
                # Truncate text if too long for model
                max_input_length = 1024
                if len(text.split()) > max_input_length:
                    text = ' '.join(text.split()[:max_input_length])
                
                summary = self.summarizer(text, 
                                        max_length=max_length, 
                                        min_length=30, 
                                        do_sample=False)
                return summary[0]['summary_text']
            else:
                # Extractive summarization (first few sentences)
                sentences = re.split(r'[.!?]+', text)
                return '. '.join(sentences[:3]) + '.'
                
        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            # Fallback to first 150 words
            words = text.split()
            return ' '.join(words[:max_length//10]) + '...'

    def calculate_reading_time(self, text: str) -> int:
        """Calculate estimated reading time in minutes."""
        words = len(text.split())
        # Average reading speed: 200-250 words per minute
        return max(1, round(words / 225))

    def detect_duplicates(self, text: str, existing_hashes: List[str] = None) -> Dict[str, Any]:
        """Detect near-duplicates using SimHash."""
        try:
            simhash_obj = Simhash(text)
            current_hash = str(simhash_obj.value)
            
            duplicates = []
            if existing_hashes:
                for existing_hash in existing_hashes:
                    try:
                        existing_simhash = Simhash(int(existing_hash))
                        distance = simhash_obj.distance(existing_simhash)
                        if distance <= 3:  # Threshold for near-duplicates
                            duplicates.append({
                                "hash": existing_hash,
                                "distance": distance
                            })
                    except:
                        continue
            
            return {
                "hash": current_hash,
                "is_duplicate": len(duplicates) > 0,
                "duplicates": duplicates
            }
        except Exception as e:
            logger.error(f"Duplicate detection failed: {e}")
            return {"hash": "", "is_duplicate": False, "duplicates": []}

    def extract_claims(self, text: str) -> List[str]:
        """Extract factual claims from text."""
        # Simple claim extraction based on patterns
        claim_patterns = [
            r'[A-Z][^.!?]*(?:said|stated|reported|announced|declared|claimed)[^.!?]*[.!?]',
            r'[A-Z][^.!?]*(?:according to|research shows|study finds|data indicates)[^.!?]*[.!?]',
            r'[A-Z][^.!?]*(?:\d+%|\d+\.\d+%|statistics|numbers)[^.!?]*[.!?]'
        ]
        
        claims = []
        for pattern in claim_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            claims.extend(matches)
        
        return list(set(claims))[:10]  # Return unique claims, max 10

    def process_image(self, image_path: str) -> Dict[str, Any]:
        """Extract text and metadata from images."""
        try:
            # Load image
            image = Image.open(image_path)
            
            # Generate perceptual hash
            img_hash = str(imagehash.phash(image))
            
            # Extract text using OCR
            ocr_text = pytesseract.image_to_string(image)
            
            # Basic image analysis
            width, height = image.size
            
            return {
                "hash": img_hash,
                "ocr_text": ocr_text.strip(),
                "width": width,
                "height": height,
                "format": image.format
            }
        except Exception as e:
            logger.error(f"Image processing failed: {e}")
            return {"hash": "", "ocr_text": "", "width": 0, "height": 0, "format": ""}

    def analyze(self, text: str, title: str = "", images: List[str] = None) -> Dict[str, Any]:
        """Complete NLP analysis pipeline."""
        if not text:
            return self._empty_analysis()
        
        # Combine title and text for analysis
        full_text = f"{title} {text}".strip()
        
        # Language detection
        language = self.detect_language(full_text)
        
        # Core NLP analysis
        entities = self.extract_entities(full_text, language)
        sentiment = self.analyze_sentiment(full_text)
        keyphrases = self.extract_keyphrases(full_text, language)
        embedding = self.generate_embedding(full_text)
        summary = self.summarize_text(text)
        reading_time = self.calculate_reading_time(text)
        duplicate_info = self.detect_duplicates(full_text)
        claims = self.extract_claims(text)
        
        # Image processing
        image_data = []
        if images:
            for img_path in images:
                img_analysis = self.process_image(img_path)
                if img_analysis["ocr_text"]:
                    image_data.append(img_analysis)
        
        return {
            "language": language,
            "entities": entities,
            "sentiment": sentiment,
            "keyphrases": keyphrases,
            "embedding": embedding,
            "summary": summary,
            "reading_time": reading_time,
            "duplicate_info": duplicate_info,
            "claims": claims,
            "image_data": image_data,
            "processed_at": datetime.utcnow().isoformat()
        }

    def _empty_analysis(self) -> Dict[str, Any]:
        """Return empty analysis structure."""
        return {
            "language": "en",
            "entities": [],
            "sentiment": {"positive": 0.0, "negative": 0.0, "neutral": 1.0, "compound": 0.0},
            "keyphrases": [],
            "embedding": [0.0] * 384,
            "summary": "",
            "reading_time": 0,
            "duplicate_info": {"hash": "", "is_duplicate": False, "duplicates": []},
            "claims": [],
            "image_data": [],
            "processed_at": datetime.utcnow().isoformat()
        }

    def embed(self, text: str) -> List[float]:
        """Generate embedding for text (compatibility method)."""
        return self.generate_embedding(text)

# Initialize the advanced NLP pipeline
nlp = AdvancedNLPPipeline()
