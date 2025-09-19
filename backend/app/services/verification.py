"""
app/services/verification.py
- Claim verification and credibility scoring system.
- Uses RAG over trusted sources for fact-checking and provenance tracking.
"""
from typing import Dict, Any, List, Optional, Tuple
import logging
import json
import hashlib
from datetime import datetime, timezone
from dataclasses import dataclass

# RAG and vector search
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI
import chromadb

# Database
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger(__name__)

@dataclass
class CredibilityFactors:
    """Factors that contribute to article credibility."""
    source_trust_score: float = 0.0
    claim_verification_score: float = 0.0
    author_reputation: float = 0.0
    publication_date_relevance: float = 0.0
    citation_quality: float = 0.0
    fact_check_consensus: float = 0.0
    
    def overall_score(self) -> float:
        """Calculate weighted overall credibility score."""
        weights = {
            'source_trust': 0.25,
            'claim_verification': 0.30,
            'author_reputation': 0.15,
            'date_relevance': 0.10,
            'citation_quality': 0.10,
            'fact_check_consensus': 0.10
        }
        
        return (
            self.source_trust_score * weights['source_trust'] +
            self.claim_verification_score * weights['claim_verification'] +
            self.author_reputation * weights['author_reputation'] +
            self.publication_date_relevance * weights['date_relevance'] +
            self.citation_quality * weights['citation_quality'] +
            self.fact_check_consensus * weights['fact_check_consensus']
        )

class TrustedSourceManager:
    """Manages trusted sources and their reliability scores."""
    
    def __init__(self):
        # Initialize with some well-known trusted sources
        self.trusted_sources = {
            # News agencies
            'reuters.com': 0.95,
            'ap.org': 0.95,
            'bbc.com': 0.90,
            'npr.org': 0.88,
            'pbs.org': 0.87,
            
            # Academic/Research
            'nature.com': 0.98,
            'science.org': 0.98,
            'nejm.org': 0.97,
            'pubmed.ncbi.nlm.nih.gov': 0.96,
            
            # Government sources
            'cdc.gov': 0.94,
            'who.int': 0.93,
            'gov.uk': 0.90,
            'europa.eu': 0.89,
            
            # Fact-checkers
            'snopes.com': 0.85,
            'factcheck.org': 0.87,
            'politifact.com': 0.83,
            'fullfact.org': 0.86
        }
        
        # Sources with known bias or reliability issues
        self.problematic_sources = {
            'example-fake-news.com': 0.1,
            'conspiracy-site.net': 0.15,
            # Add more as needed
        }
    
    def get_source_trust_score(self, url: str) -> float:
        """Get trust score for a source URL."""
        from urllib.parse import urlparse
        
        try:
            domain = urlparse(url).netloc.lower()
            
            # Remove www. prefix
            if domain.startswith('www.'):
                domain = domain[4:]
            
            # Check trusted sources
            if domain in self.trusted_sources:
                return self.trusted_sources[domain]
            
            # Check problematic sources
            if domain in self.problematic_sources:
                return self.problematic_sources[domain]
            
            # Default score for unknown sources
            return 0.5
            
        except Exception as e:
            logger.error(f"Error parsing URL {url}: {e}")
            return 0.5

class ClaimVerificationEngine:
    """RAG-based claim verification system."""
    
    def __init__(self, db_session: Session = None):
        self.db_session = db_session
        self.trusted_source_manager = TrustedSourceManager()
        self._initialize_rag_system()
    
    def _initialize_rag_system(self):
        """Initialize the RAG system with trusted knowledge base."""
        try:
            # Initialize embeddings
            self.embeddings = SentenceTransformerEmbeddings(
                model_name="all-MiniLM-L6-v2"
            )
            
            # Initialize vector store
            self.vectorstore = None
            self._build_trusted_knowledge_base()
            
            # Initialize LLM for verification
            self.llm = None  # Will be initialized when OpenAI key is available
            
        except Exception as e:
            logger.error(f"Failed to initialize RAG system: {e}")
            self.embeddings = None
            self.vectorstore = None
    
    def _build_trusted_knowledge_base(self):
        """Build vector database from trusted sources."""
        try:
            # This would typically be populated from crawled trusted sources
            # For now, we'll create a minimal knowledge base
            
            trusted_documents = [
                Document(
                    page_content="The World Health Organization (WHO) is a specialized agency of the United Nations responsible for international public health.",
                    metadata={"source": "who.int", "trust_score": 0.93, "type": "factual"}
                ),
                Document(
                    page_content="Reuters is an international news agency headquartered in London, known for factual reporting.",
                    metadata={"source": "reuters.com", "trust_score": 0.95, "type": "factual"}
                ),
                # Add more trusted content here
            ]
            
            if self.embeddings:
                self.vectorstore = Chroma.from_documents(
                    documents=trusted_documents,
                    embedding=self.embeddings,
                    collection_name="trusted_knowledge"
                )
            
        except Exception as e:
            logger.error(f"Failed to build knowledge base: {e}")
    
    def verify_claim(self, claim: str) -> Dict[str, Any]:
        """Verify a factual claim against trusted sources."""
        if not self.vectorstore:
            return self._fallback_verification(claim)
        
        try:
            # Retrieve relevant documents
            relevant_docs = self.vectorstore.similarity_search(
                claim, k=5
            )
            
            # Analyze supporting and conflicting evidence
            supporting_evidence = []
            conflicting_evidence = []
            
            for doc in relevant_docs:
                similarity_score = self._calculate_semantic_similarity(claim, doc.page_content)
                
                if similarity_score > 0.7:
                    supporting_evidence.append({
                        "content": doc.page_content,
                        "source": doc.metadata.get("source", "unknown"),
                        "trust_score": doc.metadata.get("trust_score", 0.5),
                        "similarity": similarity_score
                    })
                elif similarity_score < 0.3:
                    conflicting_evidence.append({
                        "content": doc.page_content,
                        "source": doc.metadata.get("source", "unknown"),
                        "trust_score": doc.metadata.get("trust_score", 0.5),
                        "similarity": similarity_score
                    })
            
            # Calculate verification score
            verification_score = self._calculate_verification_score(
                supporting_evidence, conflicting_evidence
            )
            
            return {
                "claim": claim,
                "verification_score": verification_score,
                "supporting_evidence": supporting_evidence,
                "conflicting_evidence": conflicting_evidence,
                "confidence": min(0.95, len(supporting_evidence) * 0.2),
                "verified_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Claim verification failed: {e}")
            return self._fallback_verification(claim)
    
    def _calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between two texts."""
        try:
            if not self.embeddings:
                return 0.5
            
            # Simple word overlap as fallback
            words1 = set(text1.lower().split())
            words2 = set(text2.lower().split())
            
            if not words1 or not words2:
                return 0.0
            
            intersection = words1.intersection(words2)
            union = words1.union(words2)
            
            return len(intersection) / len(union)
            
        except Exception as e:
            logger.error(f"Similarity calculation failed: {e}")
            return 0.5
    
    def _calculate_verification_score(self, supporting: List[Dict], conflicting: List[Dict]) -> float:
        """Calculate overall verification score based on evidence."""
        if not supporting and not conflicting:
            return 0.5  # Neutral when no evidence
        
        # Weight evidence by source trust scores
        support_weight = sum(ev["trust_score"] * ev["similarity"] for ev in supporting)
        conflict_weight = sum(ev["trust_score"] * ev["similarity"] for ev in conflicting)
        
        total_weight = support_weight + conflict_weight
        
        if total_weight == 0:
            return 0.5
        
        return support_weight / total_weight
    
    def _fallback_verification(self, claim: str) -> Dict[str, Any]:
        """Fallback verification when RAG system is unavailable."""
        return {
            "claim": claim,
            "verification_score": 0.5,
            "supporting_evidence": [],
            "conflicting_evidence": [],
            "confidence": 0.1,
            "verified_at": datetime.utcnow().isoformat(),
            "note": "Verification system unavailable - neutral score assigned"
        }

class CredibilityScorer:
    """Comprehensive credibility scoring system."""
    
    def __init__(self, db_session: Session = None):
        self.db_session = db_session
        self.trusted_source_manager = TrustedSourceManager()
        self.claim_verifier = ClaimVerificationEngine(db_session)
    
    def calculate_credibility(self, article_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate comprehensive credibility score for an article."""
        factors = CredibilityFactors()
        
        # Source trust score
        if article_data.get('source_url'):
            factors.source_trust_score = self.trusted_source_manager.get_source_trust_score(
                article_data['source_url']
            )
        
        # Claim verification
        claims = article_data.get('claims', [])
        if claims:
            claim_scores = []
            for claim in claims[:5]:  # Verify top 5 claims
                verification = self.claim_verifier.verify_claim(claim)
                claim_scores.append(verification['verification_score'])
            
            factors.claim_verification_score = sum(claim_scores) / len(claim_scores)
        else:
            factors.claim_verification_score = 0.5  # Neutral when no claims
        
        # Author reputation (placeholder - would integrate with author database)
        factors.author_reputation = self._assess_author_reputation(
            article_data.get('author', '')
        )
        
        # Publication date relevance
        factors.publication_date_relevance = self._assess_date_relevance(
            article_data.get('published_at')
        )
        
        # Citation quality
        factors.citation_quality = self._assess_citation_quality(
            article_data.get('body_text', '')
        )
        
        # Fact-check consensus (placeholder)
        factors.fact_check_consensus = 0.5
        
        # Calculate overall score
        overall_score = factors.overall_score()
        
        # Create provenance record
        provenance = self._create_provenance_record(article_data, factors)
        
        return {
            "credibility_score": overall_score,
            "factors": {
                "source_trust": factors.source_trust_score,
                "claim_verification": factors.claim_verification_score,
                "author_reputation": factors.author_reputation,
                "date_relevance": factors.publication_date_relevance,
                "citation_quality": factors.citation_quality,
                "fact_check_consensus": factors.fact_check_consensus
            },
            "confidence": min(0.9, overall_score),
            "provenance": provenance,
            "assessed_at": datetime.utcnow().isoformat()
        }
    
    def _assess_author_reputation(self, author: str) -> float:
        """Assess author reputation (placeholder implementation)."""
        if not author:
            return 0.5
        
        # This would integrate with a database of author reputations
        # For now, return neutral score
        return 0.6
    
    def _assess_date_relevance(self, published_at: str) -> float:
        """Assess how recent/relevant the publication date is."""
        if not published_at:
            return 0.5
        
        try:
            from dateutil import parser
            pub_date = parser.parse(published_at)
            now = datetime.now(timezone.utc)
            
            days_old = (now - pub_date).days
            
            # More recent articles get higher scores
            if days_old <= 1:
                return 1.0
            elif days_old <= 7:
                return 0.9
            elif days_old <= 30:
                return 0.8
            elif days_old <= 90:
                return 0.7
            elif days_old <= 365:
                return 0.6
            else:
                return 0.5
                
        except Exception as e:
            logger.error(f"Date parsing failed: {e}")
            return 0.5
    
    def _assess_citation_quality(self, text: str) -> float:
        """Assess quality of citations and references in the text."""
        if not text:
            return 0.5
        
        # Look for citation patterns
        citation_patterns = [
            r'https?://[^\s]+',  # URLs
            r'\[[\d,\s]+\]',     # Numbered citations
            r'\([^)]*\d{4}[^)]*\)',  # Year citations
            r'according to [A-Z][^.]*',  # Attribution phrases
        ]
        
        citation_count = 0
        for pattern in citation_patterns:
            import re
            matches = re.findall(pattern, text, re.IGNORECASE)
            citation_count += len(matches)
        
        # Normalize by text length
        text_length = len(text.split())
        citation_density = citation_count / max(text_length, 1) * 1000
        
        # Score based on citation density
        if citation_density >= 10:
            return 0.9
        elif citation_density >= 5:
            return 0.8
        elif citation_density >= 2:
            return 0.7
        elif citation_density >= 1:
            return 0.6
        else:
            return 0.5
    
    def _create_provenance_record(self, article_data: Dict[str, Any], factors: CredibilityFactors) -> Dict[str, Any]:
        """Create a provenance record for transparency."""
        return {
            "article_id": article_data.get('id'),
            "assessment_method": "automated_credibility_scoring_v1.0",
            "source_url": article_data.get('source_url'),
            "crawl_timestamp": article_data.get('created_at'),
            "content_hash": hashlib.sha256(
                (article_data.get('body_text', '') + article_data.get('title', '')).encode()
            ).hexdigest()[:16],
            "factors_used": [
                "source_trust", "claim_verification", "author_reputation",
                "date_relevance", "citation_quality", "fact_check_consensus"
            ],
            "verification_sources": ["trusted_knowledge_base"],
            "created_at": datetime.utcnow().isoformat()
        }

# Initialize the credibility scorer
credibility_scorer = CredibilityScorer()
