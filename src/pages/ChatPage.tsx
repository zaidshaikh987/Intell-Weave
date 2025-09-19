import React from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import { MessageCircle, Sparkles, Shield, Clock } from 'lucide-react';

export default function ChatPage() {
  // In a real app, this would come from auth context
  const userId = "user_123"; // Placeholder

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Sidebar with features */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Ask the News</h2>
                  <p className="text-sm text-gray-600">AI-powered news assistant</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Intelligent Answers</h3>
                    <p className="text-sm text-gray-600">Get contextual answers from recent news with source citations</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Verified Sources</h3>
                    <p className="text-sm text-gray-600">All answers backed by credible, fact-checked sources</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Real-time Updates</h3>
                    <p className="text-sm text-gray-600">Access to the latest news and breaking developments</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Example Questions</h3>
              <div className="space-y-2">
                {[
                  "What's the latest on climate change policy?",
                  "Tell me about recent tech industry news",
                  "What are the current economic indicators?",
                  "Any updates on international relations?",
                  "What's happening in healthcare research?"
                ].map((question, index) => (
                  <button
                    key={index}
                    className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={() => {
                      // This would trigger the question in the chat
                      console.log('Suggested question:', question);
                    }}
                  >
                    "{question}"
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Pro Tip</h3>
              <p className="text-sm text-gray-700">
                Ask specific questions for better results. Include timeframes, locations, 
                or specific topics to get more targeted information.
              </p>
            </div>
          </div>

          {/* Main chat interface */}
          <div className="lg:col-span-3">
            <ChatInterface userId={userId} />
          </div>
        </div>
      </div>
    </div>
  );
}
