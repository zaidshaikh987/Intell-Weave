import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, ExternalLink, Info } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{
    title: string;
    source_url: string;
    credibility_score: number;
    relevance_score: number;
  }>;
  confidence?: number;
  provenance?: any;
}

interface ChatInterfaceProps {
  conversationId?: string;
  userId?: string;
}

export default function ChatInterface({ conversationId, userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startConversation = async () => {
    if (!userId) return null;
    
    try {
      const response = await fetch('/api/chat/conversation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.conversation_id;
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
    return null;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      let convId = currentConversationId;
      if (!convId && userId) {
        convId = await startConversation();
        setCurrentConversationId(convId);
      }

      const response = await fetch('http://localhost:8000/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: inputValue,
          conversation_id: convId,
          user_id: userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: ChatMessage = {
          id: data.query_id,
          type: 'assistant',
          content: data.answer,
          timestamp: data.timestamp,
          sources: data.sources,
          confidence: data.confidence,
          provenance: data.provenance
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        if (data.conversation_id && !currentConversationId) {
          setCurrentConversationId(data.conversation_id);
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCredibilityColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b bg-gray-50 rounded-t-lg">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Ask the News</h3>
        <div className="ml-auto text-sm text-gray-500">
          {currentConversationId && `ID: ${currentConversationId.slice(-8)}`}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Ask me about recent news</p>
            <p className="text-sm">I can help you find information, verify claims, and provide context from trusted sources.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Assistant message metadata */}
              {message.type === 'assistant' && (
                <div className="mt-3 space-y-2">
                  {/* Confidence indicator */}
                  {message.confidence !== undefined && (
                    <div className="flex items-center gap-2 text-xs">
                      <Info className="w-3 h-3" />
                      <span>Confidence: </span>
                      <span className={getConfidenceColor(message.confidence)}>
                        {(message.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-600">Sources:</div>
                      {message.sources.map((source, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <a
                            href={source.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 truncate"
                          >
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{source.title}</span>
                          </a>
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${getCredibilityColor(
                              source.credibility_score
                            )}`}
                          >
                            {(source.credibility_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="text-xs opacity-70 mt-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about recent news..."
            className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
