"""
app/routers/verification.py
- Claim verification and credibility scoring endpoints.
- Provides fact-checking and source trust analysis.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import logging

from ..core.db import get_db
from ..services.verification import credibility_scorer

logger = logging.getLogger(__name__)
router = APIRouter()

class ClaimVerificationRequest(BaseModel):
    claim: str

class CredibilityRequest(BaseModel):
    article_id: str

class CredibilityResponse(BaseModel):
    credibility_score: float
    factors: Dict[str, float]
    confidence: float
    provenance: Dict[str, Any]
    assessed_at: str

@router.post("/verify-claim")
def verify_claim(
    request: ClaimVerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify a factual claim against trusted sources."""
    try:
        verification_engine = credibility_scorer.claim_verifier
        result = verification_engine.verify_claim(request.claim)
        
        return {
            "claim": request.claim,
            "verification_result": result,
            "status": "verified" if result["verification_score"] > 0.7 else 
                     "disputed" if result["verification_score"] < 0.3 else "uncertain"
        }
        
    except Exception as e:
        logger.error(f"Claim verification failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to verify claim"
        )

@router.post("/assess-credibility/{article_id}", response_model=CredibilityResponse)
def assess_article_credibility(
    article_id: str,
    db: Session = Depends(get_db)
):
    """Assess credibility of an article."""
    try:
        # Get article data
        from sqlalchemy import text
        query = text("""
            SELECT a.id, a.title, a.body_text, a.author, a.source_url, 
                   a.published_at, an.claims, an.credibility_score
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
            "body_text": result.body_text,
            "author": result.author,
            "source_url": result.source_url,
            "published_at": result.published_at.isoformat() if result.published_at else None,
            "claims": result.claims or []
        }
        
        # Calculate credibility
        credibility_result = credibility_scorer.calculate_credibility(article_data)
        
        # Update database with new score
        update_query = text("""
            UPDATE article_nlp 
            SET credibility_score = :score
            WHERE article_id = :article_id
        """)
        
        db.execute(update_query, {
            "score": credibility_result["credibility_score"],
            "article_id": article_id
        })
        db.commit()
        
        return CredibilityResponse(**credibility_result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Credibility assessment failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to assess article credibility"
        )

@router.get("/source-trust/{source_url}")
def get_source_trust_score(source_url: str):
    """Get trust score for a news source."""
    try:
        trust_score = credibility_scorer.trusted_source_manager.get_source_trust_score(source_url)
        
        return {
            "source_url": source_url,
            "trust_score": trust_score,
            "category": "trusted" if trust_score > 0.8 else 
                      "reliable" if trust_score > 0.6 else
                      "questionable" if trust_score > 0.4 else "unreliable"
        }
        
    except Exception as e:
        logger.error(f"Source trust assessment failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to assess source trust"
        )

@router.get("/credibility-factors")
def get_credibility_factors():
    """Get information about credibility assessment factors."""
    return {
        "factors": [
            {
                "name": "source_trust",
                "description": "Trustworthiness of the news source",
                "weight": 0.25
            },
            {
                "name": "claim_verification", 
                "description": "Verification status of factual claims",
                "weight": 0.30
            },
            {
                "name": "author_reputation",
                "description": "Reputation and track record of the author",
                "weight": 0.15
            },
            {
                "name": "date_relevance",
                "description": "Recency and timeliness of the article",
                "weight": 0.10
            },
            {
                "name": "citation_quality",
                "description": "Quality and quantity of citations and references",
                "weight": 0.10
            },
            {
                "name": "fact_check_consensus",
                "description": "Consensus from fact-checking organizations",
                "weight": 0.10
            }
        ],
        "scoring_range": {
            "min": 0.0,
            "max": 1.0,
            "thresholds": {
                "highly_credible": 0.8,
                "credible": 0.6,
                "questionable": 0.4,
                "low_credibility": 0.2
            }
        }
    }
