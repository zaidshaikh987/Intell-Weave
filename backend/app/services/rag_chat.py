"""
app/services/rag_chat.py
- RAG-based chat system for "Ask the News" functionality.
- Provides explainable answers with source citations and provenance.
"""
from typing import Dict, Any, List, Optional, Tuple
import logging
import json
from datetime import datetime, timedelta
from dataclasses import dataclass

# RAG components
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.llms import OpenAI
from langchain.callbacks import get_openai_callback

# Database
from sqlalchemy.orm import Session
from sqlalchemy import text, and_, or_

# Local services
from .nlp import nlp
from .verification import credibility_scorer

logger = logging.getLogger(__name__)

@dataclass
class ChatResponse:
    """Structured chat response with sources and provenance."""
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    provenance: Dict[str, Any]
    query_id: str
    timestamp: str

class NewsKnowledgeBase:
    """Manages the news knowledge base for RAG retrieval."""
    
    def __init__(self, db_session: Session):
        self.db_session = db_session
        self.embeddings = None
        self.vectorstore = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        self._initialize_vectorstore()
    
    def _initialize_vectorstore(self):
        """Initialize the vector store with embeddings."""
        try:
            self.embeddings = SentenceTransformerEmbeddings(
                model_name="all-MiniLM-L6-v2"
            )
            
            # Initialize empty vector store
            self.vectorstore = Chroma(
                embedding_function=self.embeddings,
                collection_name="news_knowledge_base"
            )
            
            # Load existing articles into vector store
            self._populate_knowledge_base()
            
        except Exception as e:
            logger.error(f"Failed to initialize vector store: {e}")
    
    def _populate_knowledge_base(self):
        """Populate vector store with existing articles."""
        try:
            # Query recent articles from database
            query = text("""
                SELECT a.id, a.title, a.body_text, a.source_url, a.published_at,
                       an.summary, an.credibility_score, an.key_entities, an.topics
                FROM articles a
                LEFT JOIN article_nlp an ON a.id = an.article_id
                WHERE a.published_at > :cutoff_date
                ORDER BY a.published_at DESC
                LIMIT 1000
            """)
            
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            result = self.db_session.execute(query, {"cutoff_date": cutoff_date})
            
            documents = []
            for row in result:
                # Create document chunks
                content = f"{row.title}\n\n{row.body_text or ''}"
                chunks = self.text_splitter.split_text(content)
                
                for i, chunk in enumerate(chunks):
                    metadata = {
                        "article_id": row.id,
                        "title": row.title,
                        "source_url": row.source_url,
                        "published_at": row.published_at.isoformat() if row.published_at else "",
                        "summary": row.summary or "",
                        "credibility_score": float(row.credibility_score or 0.5),
                        "entities": json.loads(row.key_entities or "[]"),
                        "topics": row.topics or [],
                        "chunk_index": i
                    }
                    
                    documents.append(Document(
                        page_content=chunk,
                        metadata=metadata
                    ))
            
            if documents:
                self.vectorstore.add_documents(documents)
                logger.info(f"Populated knowledge base with {len(documents)} document chunks")
            
        except Exception as e:
            logger.error(f"Failed to populate knowledge base: {e}")
    
    def add_article(self, article_data: Dict[str, Any]):
        """Add a new article to the knowledge base."""
        try:
            content = f"{article_data.get('title', '')}\n\n{article_data.get('body_text', '')}"
            chunks = self.text_splitter.split_text(content)
            
            documents = []
            for i, chunk in enumerate(chunks):
                metadata = {
                    "article_id": article_data.get('id'),
                    "title": article_data.get('title', ''),
                    "source_url": article_data.get('source_url', ''),
                    "published_at": article_data.get('published_at', ''),
                    "summary": article_data.get('summary', ''),
                    "credibility_score": article_data.get('credibility_score', 0.5),
                    "entities": article_data.get('entities', []),
                    "topics": article_data.get('topics', []),
                    "chunk_index": i
                }
                
                documents.append(Document(
                    page_content=chunk,
                    metadata=metadata
                ))
            
            if documents and self.vectorstore:
                self.vectorstore.add_documents(documents)
                
        except Exception as e:
            logger.error(f"Failed to add article to knowledge base: {e}")
    
    def search(self, query: str, k: int = 5, 
              filters: Dict[str, Any] = None) -> List[Document]:
        """Search the knowledge base for relevant documents."""
        try:
            if not self.vectorstore:
                return []
            
            # Apply filters if provided
            search_kwargs = {"k": k}
            if filters:
                search_kwargs["filter"] = filters
            
            # Perform similarity search
            docs = self.vectorstore.similarity_search(query, **search_kwargs)
            
            # Sort by credibility score and recency
            docs.sort(key=lambda x: (
                x.metadata.get('credibility_score', 0.5),
                x.metadata.get('published_at', '')
            ), reverse=True)
            
            return docs
            
        except Exception as e:
            logger.error(f"Knowledge base search failed: {e}")
            return []

class NewsRAGChain:
    """RAG chain for answering questions about news."""
    
    def __init__(self, knowledge_base: NewsKnowledgeBase):
        self.knowledge_base = knowledge_base
        self.llm = None
        self._initialize_llm()
        self._create_prompt_template()
    
    def _initialize_llm(self):
        """Initialize the language model."""
        try:
            # Try to initialize OpenAI LLM
            self.llm = OpenAI(
                temperature=0.1,
                max_tokens=500,
                model_name="gpt-3.5-turbo-instruct"
            )
        except Exception as e:
            logger.warning(f"Failed to initialize OpenAI LLM: {e}")
            self.llm = None
    
    def _create_prompt_template(self):
        """Create the prompt template for RAG."""
        self.prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template="""You are a knowledgeable news analyst. Answer the question based on the provided news context.

Context from recent news articles:
{context}

Question: {question}

Instructions:
1. Provide a clear, factual answer based on the context
2. If the context doesn't contain enough information, say so
3. Mention specific sources when possible
4. Be objective and avoid speculation
5. If there are conflicting reports, acknowledge them

Answer:"""
        )
    
    def answer_question(self, question: str, 
                       filters: Dict[str, Any] = None) -> ChatResponse:
        """Answer a question using RAG over news articles."""
        try:
            # Generate query ID for tracking
            query_id = f"q_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
            
            # Search for relevant documents
            relevant_docs = self.knowledge_base.search(
                question, k=5, filters=filters
            )
            
            if not relevant_docs:
                return ChatResponse(
                    answer="I don't have enough recent news information to answer that question.",
                    sources=[],
                    confidence=0.1,
                    provenance=self._create_provenance(question, [], query_id),
                    query_id=query_id,
                    timestamp=datetime.utcnow().isoformat()
                )
            
            # Prepare context from documents
            context = self._prepare_context(relevant_docs)
            
            # Generate answer
            if self.llm:
                answer = self._generate_llm_answer(question, context)
                confidence = 0.8
            else:
                answer = self._generate_fallback_answer(question, relevant_docs)
                confidence = 0.6
            
            # Extract sources
            sources = self._extract_sources(relevant_docs)
            
            # Create provenance record
            provenance = self._create_provenance(question, relevant_docs, query_id)
            
            return ChatResponse(
                answer=answer,
                sources=sources,
                confidence=confidence,
                provenance=provenance,
                query_id=query_id,
                timestamp=datetime.utcnow().isoformat()
            )
            
        except Exception as e:
            logger.error(f"Question answering failed: {e}")
            return ChatResponse(
                answer="I encountered an error while processing your question. Please try again.",
                sources=[],
                confidence=0.0,
                provenance={},
                query_id="error",
                timestamp=datetime.utcnow().isoformat()
            )
    
    def _prepare_context(self, docs: List[Document]) -> str:
        """Prepare context string from retrieved documents."""
        context_parts = []
        
        for i, doc in enumerate(docs[:3]):  # Use top 3 documents
            source_info = f"Source {i+1}: {doc.metadata.get('title', 'Unknown')}"
            if doc.metadata.get('source_url'):
                source_info += f" ({doc.metadata['source_url']})"
            
            context_parts.append(f"{source_info}\n{doc.page_content}\n")
        
        return "\n".join(context_parts)
    
    def _generate_llm_answer(self, question: str, context: str) -> str:
        """Generate answer using LLM."""
        try:
            prompt = self.prompt_template.format(
                context=context,
                question=question
            )
            
            with get_openai_callback() as cb:
                response = self.llm(prompt)
                logger.info(f"LLM usage: {cb.total_tokens} tokens, ${cb.total_cost:.4f}")
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            return self._generate_fallback_answer(question, [])
    
    def _generate_fallback_answer(self, question: str, docs: List[Document]) -> str:
        """Generate fallback answer without LLM."""
        if not docs:
            return "I don't have enough information to answer that question."
        
        # Simple extractive approach
        relevant_sentences = []
        question_words = set(question.lower().split())
        
        for doc in docs[:2]:
            sentences = doc.page_content.split('.')
            for sentence in sentences:
                sentence_words = set(sentence.lower().split())
                overlap = len(question_words.intersection(sentence_words))
                
                if overlap >= 2:  # At least 2 word overlap
                    relevant_sentences.append(sentence.strip())
        
        if relevant_sentences:
            return ". ".join(relevant_sentences[:3]) + "."
        else:
            return f"Based on recent news, here's what I found: {docs[0].page_content[:200]}..."
    
    def _extract_sources(self, docs: List[Document]) -> List[Dict[str, Any]]:
        """Extract source information from documents."""
        sources = []
        seen_articles = set()
        
        for doc in docs:
            article_id = doc.metadata.get('article_id')
            if article_id and article_id not in seen_articles:
                sources.append({
                    "article_id": article_id,
                    "title": doc.metadata.get('title', ''),
                    "source_url": doc.metadata.get('source_url', ''),
                    "published_at": doc.metadata.get('published_at', ''),
                    "credibility_score": doc.metadata.get('credibility_score', 0.5),
                    "relevance_score": 0.9  # Would be calculated based on similarity
                })
                seen_articles.add(article_id)
        
        return sources[:5]  # Return top 5 sources
    
    def _create_provenance(self, question: str, docs: List[Document], 
                          query_id: str) -> Dict[str, Any]:
        """Create provenance record for transparency."""
        return {
            "query_id": query_id,
            "question": question,
            "retrieval_method": "vector_similarity_search",
            "documents_retrieved": len(docs),
            "sources_used": len(set(doc.metadata.get('article_id') for doc in docs)),
            "search_timestamp": datetime.utcnow().isoformat(),
            "model_used": "sentence-transformers/all-MiniLM-L6-v2",
            "llm_used": "gpt-3.5-turbo-instruct" if self.llm else "extractive_fallback"
        }

class ConversationManager:
    """Manages conversation context and history."""
    
    def __init__(self, db_session: Session):
        self.db_session = db_session
        self.conversations = {}  # In-memory storage for active conversations
    
    def start_conversation(self, user_id: str) -> str:
        """Start a new conversation."""
        conversation_id = f"conv_{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        self.conversations[conversation_id] = {
            "user_id": user_id,
            "started_at": datetime.utcnow().isoformat(),
            "messages": [],
            "context": {}
        }
        
        return conversation_id
    
    def add_message(self, conversation_id: str, message: Dict[str, Any]):
        """Add a message to the conversation."""
        if conversation_id in self.conversations:
            self.conversations[conversation_id]["messages"].append({
                **message,
                "timestamp": datetime.utcnow().isoformat()
            })
    
    def get_conversation_context(self, conversation_id: str) -> Dict[str, Any]:
        """Get conversation context for better responses."""
        if conversation_id not in self.conversations:
            return {}
        
        conversation = self.conversations[conversation_id]
        recent_messages = conversation["messages"][-5:]  # Last 5 messages
        
        # Extract topics and entities from recent messages
        topics = set()
        entities = set()
        
        for msg in recent_messages:
            if msg.get("type") == "user_question":
                # Extract entities from question
                analysis = nlp.analyze(msg.get("content", ""))
                for entity in analysis.get("entities", []):
                    entities.add(entity.get("text", ""))
                
                topics.update(analysis.get("keyphrases", []))
        
        return {
            "recent_topics": list(topics),
            "recent_entities": list(entities),
            "message_count": len(conversation["messages"])
        }

class NewsRAGChatSystem:
    """Main RAG chat system for news Q&A."""
    
    def __init__(self, db_session: Session):
        self.db_session = db_session
        self.knowledge_base = NewsKnowledgeBase(db_session)
        self.rag_chain = NewsRAGChain(self.knowledge_base)
        self.conversation_manager = ConversationManager(db_session)
    
    def ask_question(self, question: str, user_id: str = None,
                    conversation_id: str = None, 
                    filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Main interface for asking questions about news."""
        try:
            # Start conversation if needed
            if not conversation_id and user_id:
                conversation_id = self.conversation_manager.start_conversation(user_id)
            
            # Get conversation context
            context = {}
            if conversation_id:
                context = self.conversation_manager.get_conversation_context(conversation_id)
                
                # Add user question to conversation
                self.conversation_manager.add_message(conversation_id, {
                    "type": "user_question",
                    "content": question,
                    "user_id": user_id
                })
            
            # Enhance filters with conversation context
            if context.get("recent_entities"):
                if not filters:
                    filters = {}
                # Could add entity-based filtering here
            
            # Get answer from RAG chain
            response = self.rag_chain.answer_question(question, filters)
            
            # Add response to conversation
            if conversation_id:
                self.conversation_manager.add_message(conversation_id, {
                    "type": "system_response",
                    "content": response.answer,
                    "sources": response.sources,
                    "confidence": response.confidence,
                    "query_id": response.query_id
                })
            
            return {
                "answer": response.answer,
                "sources": response.sources,
                "confidence": response.confidence,
                "provenance": response.provenance,
                "conversation_id": conversation_id,
                "query_id": response.query_id,
                "timestamp": response.timestamp
            }
            
        except Exception as e:
            logger.error(f"Chat system error: {e}")
            return {
                "answer": "I'm sorry, I encountered an error processing your question.",
                "sources": [],
                "confidence": 0.0,
                "provenance": {},
                "conversation_id": conversation_id,
                "query_id": "error",
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def add_article_to_knowledge_base(self, article_data: Dict[str, Any]):
        """Add new article to the knowledge base."""
        self.knowledge_base.add_article(article_data)
    
    def get_conversation_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get conversation history."""
        if conversation_id in self.conversation_manager.conversations:
            return self.conversation_manager.conversations[conversation_id]["messages"]
        return []

# Initialize the RAG chat system (will be initialized with db_session in routes)
def create_rag_chat_system(db_session: Session) -> NewsRAGChatSystem:
    """Factory function to create RAG chat system with database session."""
    return NewsRAGChatSystem(db_session)
