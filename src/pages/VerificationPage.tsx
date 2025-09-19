import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, Search, Link, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';

export default function VerificationPage() {
  const [claimText, setClaimText] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  // Sample verification results
  const sampleResults = {
    claim: "Electric vehicles will make up 50% of new car sales by 2030",
    credibilityScore: 7.8,
    status: "Partially Verified",
    confidence: 0.78,
    sources: [
      {
        title: "IEA Global EV Outlook 2023",
        url: "https://iea.org/reports/global-ev-outlook-2023",
        credibility: 9.2,
        relevance: 0.95,
        date: "2023-04-26",
        excerpt: "Under current policy settings, EVs could reach 35% of global sales by 2030..."
      },
      {
        title: "BloombergNEF Electric Vehicle Outlook",
        url: "https://about.bnef.com/electric-vehicle-outlook/",
        credibility: 8.7,
        relevance: 0.89,
        date: "2023-05-15",
        excerpt: "Our base case scenario projects EVs to account for 58% of global passenger vehicle sales by 2040..."
      },
      {
        title: "McKinsey EV Market Analysis",
        url: "https://mckinsey.com/ev-analysis",
        credibility: 8.5,
        relevance: 0.82,
        date: "2023-03-12",
        excerpt: "Regional variations suggest 30-60% EV adoption by 2030 depending on policy support..."
      }
    ],
    analysis: {
      factualAccuracy: 0.75,
      sourceReliability: 0.85,
      temporalRelevance: 0.90,
      contextualSupport: 0.70
    },
    verdict: "The claim is partially supported by credible sources. While some projections suggest 50% EV adoption by 2030 is possible, most conservative estimates place it between 30-40%. The actual outcome will depend heavily on policy implementation and technological advancement."
  };

  const handleVerification = async () => {
    if (!claimText.trim()) return;
    
    setIsVerifying(true);
    // Simulate API call
    setTimeout(() => {
      setVerificationResult(sampleResults);
      setIsVerifying(false);
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'partially verified': return 'bg-yellow-100 text-yellow-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'partially verified': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'disputed': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fact Verification</h1>
              <p className="text-gray-600 mt-1">Verify claims and statements using AI-powered fact-checking</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Enter Claim to Verify</h2>
                <p className="text-gray-600">Paste any statement, claim, or quote you want to fact-check</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  placeholder="Enter the claim you want to verify... For example: 'Electric vehicles will make up 50% of new car sales by 2030'"
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{claimText.length}/1000 characters</span>
                  <Button
                    onClick={handleVerification}
                    disabled={!claimText.trim() || isVerifying}
                    className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Verify Claim
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {verificationResult && (
              <Card className="bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Verification Results</h2>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(verificationResult.status)}
                      <Badge className={getStatusColor(verificationResult.status)}>
                        {verificationResult.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Claim */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Claim:</h3>
                    <p className="text-gray-700 italic">"{verificationResult.claim}"</p>
                  </div>

                  {/* Credibility Score */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-blue-900">Credibility Score</h3>
                      <p className="text-sm text-blue-700">Based on source reliability and factual accuracy</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-900">{verificationResult.credibilityScore}/10</div>
                      <div className="text-sm text-blue-700">Confidence: {Math.round(verificationResult.confidence * 100)}%</div>
                    </div>
                  </div>

                  {/* Analysis Breakdown */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Analysis Breakdown</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Factual Accuracy</span>
                        <span className="font-medium">{Math.round(verificationResult.analysis.factualAccuracy * 100)}%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Source Reliability</span>
                        <span className="font-medium">{Math.round(verificationResult.analysis.sourceReliability * 100)}%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Temporal Relevance</span>
                        <span className="font-medium">{Math.round(verificationResult.analysis.temporalRelevance * 100)}%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">Contextual Support</span>
                        <span className="font-medium">{Math.round(verificationResult.analysis.contextualSupport * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Verdict */}
                  <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <h3 className="font-medium text-yellow-900 mb-2">AI Verdict</h3>
                    <p className="text-yellow-800">{verificationResult.verdict}</p>
                  </div>

                  {/* Sources */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Supporting Sources</h3>
                    <div className="space-y-3">
                      {verificationResult.sources.map((source: any, index: number) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{source.title}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-100 text-blue-800">
                                {source.credibility}/10
                              </Badge>
                              <Badge className="bg-green-100 text-green-800">
                                {Math.round(source.relevance * 100)}% match
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">"{source.excerpt}"</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Link className="w-3 h-3" />
                                <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                                  View Source
                                </a>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(source.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <h3 className="font-semibold text-gray-900">How It Works</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Claim Analysis</h4>
                    <p className="text-sm text-gray-600">AI extracts key facts and claims from your input</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Source Matching</h4>
                    <p className="text-sm text-gray-600">Search through verified news sources and databases</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900">Credibility Scoring</h4>
                    <p className="text-sm text-gray-600">Rate sources and provide confidence metrics</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <h3 className="font-semibold text-gray-900">Recent Verifications</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { claim: "Renewable energy costs decreased by 40%", score: 8.5, status: "Verified" },
                  { claim: "AI will replace 50% of jobs by 2030", score: 4.2, status: "Disputed" },
                  { claim: "Global temperature rose 1.1°C since 1880", score: 9.1, status: "Verified" }
                ].map((item, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                      <span className="text-sm font-medium">{item.score}/10</span>
                    </div>
                    <p className="text-sm text-gray-700 truncate">"{item.claim}"</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-blue-50">
              <CardContent className="p-6">
                <Shield className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Pro Tip</h3>
                <p className="text-sm text-gray-700">
                  For best results, provide specific, factual claims rather than opinions or subjective statements.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
