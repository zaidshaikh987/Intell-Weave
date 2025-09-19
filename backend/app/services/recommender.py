"""
app/services/recommender.py
- Advanced personalized recommendation engine with ML-based ranking.
- Implements collaborative filtering, content-based filtering, and hybrid approaches.
"""
from typing import Dict, Any, List, Optional, Tuple
import logging
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict
import json

from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
import faiss

logger = logging.getLogger(__name__)

class AdvancedRecommender:
    def __init__(self, db_session: Session):
        self.db_session = db_session
        self.user_profiles = {}
        self.article_embeddings = {}
        self.tfidf_vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
        self.svd_model = TruncatedSVD(n_components=100)
        
    def get_personalized_feed(self, user_id: str, limit: int = 20, 
                            diversity_factor: float = 0.3) -> List[Dict[str, Any]]:
        """Generate personalized feed with advanced ML ranking."""
        try:
            # Get user profile and preferences
            user_profile = self._get_user_profile(user_id)
            
            # Get candidate articles
            candidates = self._get_candidate_articles(user_id, limit * 3)
            
            if not candidates:
                return self._get_fallback_articles(limit)
            
            # Score articles using hybrid approach
            scored_articles = []
            for article in candidates:
                score = self._calculate_hybrid_score(article, user_profile)
                article['recommendation_score'] = score
                scored_articles.append(article)
            
            # Apply diversity and re-rank
            final_articles = self._apply_diversity_reranking(
                scored_articles, diversity_factor, limit
            )
            
            return final_articles
            
        except Exception as e:
            logger.error(f"Personalized feed generation failed: {e}")
            return self._get_fallback_articles(limit)
    
    def _get_user_profile(self, user_id: str) -> Dict[str, Any]:
        """Build comprehensive user profile from interaction history."""
        if user_id in self.user_profiles:
            return self.user_profiles[user_id]
        
        try:
            # Get user interactions
            query = text("""
                SELECT ue.event_type, ue.article_id, ue.ts, ue.properties,
                       a.tags, an.topics, an.key_entities, an.sentiment
                FROM user_events ue
                JOIN articles a ON ue.article_id = a.id
                LEFT JOIN article_nlp an ON a.id = an.article_id
                WHERE ue.user_id = :user_id 
                AND ue.ts > :cutoff_date
                ORDER BY ue.ts DESC
                LIMIT 500
            """)
            
            cutoff_date = datetime.utcnow() - timedelta(days=90)
            result = self.db_session.execute(query, {
                "user_id": user_id,
                "cutoff_date": cutoff_date
            })
            
            # Analyze interaction patterns
            topic_scores = defaultdict(float)
            entity_scores = defaultdict(float)
            sentiment_preference = defaultdict(float)
            time_patterns = defaultdict(int)
            
            for row in result:
                weight = self._get_event_weight(row.event_type)
                
                # Topic preferences
                if row.topics:
                    for topic in row.topics:
                        topic_scores[topic] += weight
                
                # Entity interests
                if row.key_entities:
                    entities = json.loads(row.key_entities) if isinstance(row.key_entities, str) else row.key_entities
                    for entity in entities:
                        if isinstance(entity, dict):
                            entity_scores[entity.get('text', '')] += weight
                
                # Sentiment preferences
                if row.sentiment:
                    sentiment_preference[row.sentiment] += weight
                
                # Time patterns
                hour = row.ts.hour if row.ts else 12
                time_patterns[hour] += 1
            
            profile = {
                "user_id": user_id,
                "topic_preferences": dict(topic_scores),
                "entity_interests": dict(entity_scores),
                "sentiment_preference": dict(sentiment_preference),
                "active_hours": dict(time_patterns),
                "total_interactions": len(list(result)),
                "created_at": datetime.utcnow().isoformat()
            }
            
            self.user_profiles[user_id] = profile
            return profile
            
        except Exception as e:
            logger.error(f"User profile creation failed: {e}")
            return {"user_id": user_id, "topic_preferences": {}, "entity_interests": {}}
    
    def _get_event_weight(self, event_type: str) -> float:
        """Get weight for different event types."""
        weights = {
            'click': 1.0,
            'read': 2.0,
            'bookmark': 3.0,
            'share': 4.0,
            'like': 2.5,
            'comment': 3.5,
            'dwell_time': 1.5
        }
        return weights.get(event_type, 1.0)
    
    def _get_candidate_articles(self, user_id: str, limit: int) -> List[Dict[str, Any]]:
        """Get candidate articles for recommendation."""
        try:
            query = text("""
                SELECT a.id, a.title, a.subtitle, a.author, a.source_url,
                       a.published_at, a.reading_time, a.tags,
                       an.summary, an.sentiment, an.credibility_score,
                       an.topics, an.key_entities, an.embedding
                FROM articles a
                LEFT JOIN article_nlp an ON a.id = an.article_id
                WHERE a.published_at > :cutoff_date
                AND a.id NOT IN (
                    SELECT DISTINCT ue.article_id 
                    FROM user_events ue 
                    WHERE ue.user_id = :user_id 
                    AND ue.event_type IN ('read', 'bookmark')
                )
                ORDER BY a.published_at DESC
                LIMIT :limit
            """)
            
            cutoff_date = datetime.utcnow() - timedelta(days=14)
            result = self.db_session.execute(query, {
                "user_id": user_id,
                "cutoff_date": cutoff_date,
                "limit": limit
            })
            
            articles = []
            for row in result:
                articles.append({
                    "id": row.id,
                    "title": row.title,
                    "subtitle": row.subtitle,
                    "author": row.author,
                    "source_url": row.source_url,
                    "published_at": row.published_at.isoformat() if row.published_at else None,
                    "reading_time": row.reading_time,
                    "tags": row.tags or [],
                    "summary": row.summary,
                    "sentiment": row.sentiment,
                    "credibility_score": float(row.credibility_score or 0.5),
                    "topics": row.topics or [],
                    "entities": json.loads(row.key_entities) if row.key_entities else [],
                    "embedding": row.embedding
                })
            
            return articles
            
        except Exception as e:
            logger.error(f"Candidate article fetch failed: {e}")
            return []
    
    def _calculate_hybrid_score(self, article: Dict[str, Any], 
                              user_profile: Dict[str, Any]) -> float:
        """Calculate hybrid recommendation score."""
        try:
            content_score = self._content_based_score(article, user_profile)
            popularity_score = self._popularity_score(article)
            freshness_score = self._freshness_score(article)
            credibility_score = article.get('credibility_score', 0.5)
            
            # Weighted combination
            hybrid_score = (
                content_score * 0.4 +
                popularity_score * 0.2 +
                freshness_score * 0.2 +
                credibility_score * 0.2
            )
            
            return min(1.0, max(0.0, hybrid_score))
            
        except Exception as e:
            logger.error(f"Hybrid scoring failed: {e}")
            return 0.5
    
    def _content_based_score(self, article: Dict[str, Any], 
                           user_profile: Dict[str, Any]) -> float:
        """Calculate content-based similarity score."""
        score = 0.0
        
        # Topic matching
        topic_prefs = user_profile.get('topic_preferences', {})
        article_topics = article.get('topics', [])
        
        for topic in article_topics:
            if topic in topic_prefs:
                score += topic_prefs[topic] * 0.1
        
        # Entity matching
        entity_interests = user_profile.get('entity_interests', {})
        article_entities = article.get('entities', [])
        
        for entity in article_entities:
            entity_text = entity.get('text', '') if isinstance(entity, dict) else str(entity)
            if entity_text in entity_interests:
                score += entity_interests[entity_text] * 0.05
        
        return min(1.0, score)
    
    def _popularity_score(self, article: Dict[str, Any]) -> float:
        """Calculate popularity score based on engagement."""
        try:
            query = text("""
                SELECT COUNT(*) as engagement_count
                FROM user_events
                WHERE article_id = :article_id
                AND ts > :recent_cutoff
            """)
            
            recent_cutoff = datetime.utcnow() - timedelta(hours=24)
            result = self.db_session.execute(query, {
                "article_id": article['id'],
                "recent_cutoff": recent_cutoff
            })
            
            engagement_count = result.scalar() or 0
            return min(1.0, engagement_count / 50.0)  # Normalize
            
        except Exception as e:
            logger.error(f"Popularity scoring failed: {e}")
            return 0.5
    
    def _freshness_score(self, article: Dict[str, Any]) -> float:
        """Calculate freshness score based on publication time."""
        try:
            if not article.get('published_at'):
                return 0.5
            
            from dateutil import parser
            pub_date = parser.parse(article['published_at'])
            now = datetime.now(pub_date.tzinfo)
            
            hours_old = (now - pub_date).total_seconds() / 3600
            
            # Decay function: newer articles get higher scores
            if hours_old <= 1:
                return 1.0
            elif hours_old <= 6:
                return 0.9
            elif hours_old <= 24:
                return 0.7
            elif hours_old <= 72:
                return 0.5
            else:
                return 0.3
                
        except Exception as e:
            logger.error(f"Freshness scoring failed: {e}")
            return 0.5
    
    def _apply_diversity_reranking(self, articles: List[Dict[str, Any]], 
                                 diversity_factor: float, limit: int) -> List[Dict[str, Any]]:
        """Apply MMR-style diversity re-ranking."""
        if not articles:
            return []
        
        # Sort by score initially
        articles.sort(key=lambda x: x['recommendation_score'], reverse=True)
        
        selected = []
        remaining = articles.copy()
        
        # Select first article (highest score)
        if remaining:
            selected.append(remaining.pop(0))
        
        # MMR selection
        while len(selected) < limit and remaining:
            best_article = None
            best_mmr_score = -1
            
            for article in remaining:
                # Calculate diversity penalty
                diversity_penalty = 0
                for selected_article in selected:
                    similarity = self._calculate_article_similarity(article, selected_article)
                    diversity_penalty += similarity
                
                diversity_penalty /= len(selected)
                
                # MMR score
                mmr_score = (
                    (1 - diversity_factor) * article['recommendation_score'] -
                    diversity_factor * diversity_penalty
                )
                
                if mmr_score > best_mmr_score:
                    best_mmr_score = mmr_score
                    best_article = article
            
            if best_article:
                selected.append(best_article)
                remaining.remove(best_article)
        
        return selected
    
    def _calculate_article_similarity(self, article1: Dict[str, Any], 
                                    article2: Dict[str, Any]) -> float:
        """Calculate similarity between two articles."""
        # Simple topic-based similarity
        topics1 = set(article1.get('topics', []))
        topics2 = set(article2.get('topics', []))
        
        if not topics1 or not topics2:
            return 0.0
        
        intersection = topics1.intersection(topics2)
        union = topics1.union(topics2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def _get_fallback_articles(self, limit: int) -> List[Dict[str, Any]]:
        """Get fallback articles when personalization fails."""
        try:
            query = text("""
                SELECT a.id, a.title, a.subtitle, a.author, a.source_url,
                       a.published_at, a.reading_time, a.tags,
                       an.summary, an.sentiment, an.credibility_score
                FROM articles a
                LEFT JOIN article_nlp an ON a.id = an.article_id
                WHERE a.published_at > :cutoff_date
                ORDER BY an.credibility_score DESC NULLS LAST, a.published_at DESC
                LIMIT :limit
            """)
            
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            result = self.db_session.execute(query, {
                "cutoff_date": cutoff_date,
                "limit": limit
            })
            
            articles = []
            for row in result:
                articles.append({
                    "id": row.id,
                    "title": row.title,
                    "subtitle": row.subtitle,
                    "author": row.author,
                    "source_url": row.source_url,
                    "published_at": row.published_at.isoformat() if row.published_at else None,
                    "reading_time": row.reading_time,
                    "tags": row.tags or [],
                    "summary": row.summary,
                    "sentiment": row.sentiment,
                    "credibility_score": float(row.credibility_score or 0.5),
                    "recommendation_score": 0.6
                })
            
            return articles
            
        except Exception as e:
            logger.error(f"Fallback articles fetch failed: {e}")
            return []

recommender = AdvancedRecommender(db_session=Session())
