import React, { useState } from 'react';
import { Article } from '@/entities/all';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload as UploadIcon, FileText, Link as LinkIcon, Sparkles, AlertCircle, Brain, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import FileUpload from '@/components/upload/FileUpload';
import UrlUpload from '@/components/upload/UrlUpload';
import ManualUpload from '@/components/upload/ManualUpload';
import ProcessingStatus from '@/components/upload/ProcessingStatus';
import api from '@/api/client';

export default function UploadPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'file'|'url'|'manual'>('file');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const processManualToBackend = async (content: string, title = '', url = '') => {
    setProgress(20);
    setStatusMessage('Analyzing content...');
    try {
      await Article.create({ title: title || 'Untitled Article', content, source_url: url } as any);
      setProgress(100);
      setStatusMessage('Article processed successfully!');
      setSuccess(true);
      setTimeout(() => { navigate(createPageUrl('Feed')); }, 1200);
    } catch (e) {
      console.error('Error processing article:', e);
      setError('Failed to process article. Please try again.');
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleFileUpload = async (file: File) => {
    setProcessing(true);
    setProgress(10);
    setError('');
    setSuccess(false);
    setStatusMessage('Uploading file...');
    try {
      const form = new FormData();
      form.append('file', file);
      setProgress(40);
      setStatusMessage('Extracting content...');
      const res = await api.post<any>('/ingest/file', form);
      setProgress(100);
      setStatusMessage('Article processed successfully!');
      setSuccess(true);
      setTimeout(() => { navigate(createPageUrl('Feed')); }, 1200);
    } catch (e) {
      console.error('Error uploading file:', e);
      setError('Failed to process uploaded file. Please try again.');
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleUrlUpload = async (url: string) => {
    setProcessing(true);
    setProgress(10);
    setError('');
    setSuccess(false);
    setStatusMessage('Fetching article from URL...');
    try {
      await api.post('/ingest/url', { url });
      setProgress(100);
      setStatusMessage('Article fetched and processed!');
      setSuccess(true);
      setTimeout(() => { navigate(createPageUrl('Feed')); }, 1200);
    } catch (e) {
      console.error('Error fetching URL:', e);
      setError('Failed to fetch article from URL. Please check the URL and try again.');
      setProcessing(false);
      setProgress(0);
    }
  };

  const handleManualUpload = async (articleData: { title: string; content: string; source_url?: string }) => {
    setProcessing(true);
    setProgress(10);
    setError('');
    setSuccess(false);
    setStatusMessage('Processing manual entry...');
    try {
      await processManualToBackend(articleData.content, articleData.title, articleData.source_url || '');
    } catch (e) {
      console.error('Error processing manual entry:', e);
      setError('Failed to process article. Please try again.');
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Add New Article</h1>
          <p className="text-gray-600 text-lg">Upload files, paste URLs, or manually enter articles for AI-powered analysis</p>
        </div>

        <AnimatePresence>
          {processing && (
            <ProcessingStatus progress={progress} message={statusMessage} success={success} error={error} />
          )}
        </AnimatePresence>

        {error && !processing && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!processing && (
          <Card className="border-none shadow">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center justify-center gap-4 mb-2">
                <button onClick={() => setActiveTab('file')} className={`px-4 py-2 rounded ${activeTab==='file' ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>Upload File</button>
                <button onClick={() => setActiveTab('url')} className={`px-4 py-2 rounded ${activeTab==='url' ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>From URL</button>
                <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded ${activeTab==='manual' ? 'bg-emerald-600 text-white' : 'bg-white border'}`}>Manual Entry</button>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                {activeTab==='file' && (<FileUpload onUpload={handleFileUpload} />)}
                {activeTab==='url' && (<UrlUpload onSubmit={handleUrlUpload} />)}
                {activeTab==='manual' && (<ManualUpload onSubmit={handleManualUpload} />)}
              </AnimatePresence>
            </CardContent>
          </Card>
        )}

        {!processing && (
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <Card className="text-center p-6 border-none shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"><Brain className="w-6 h-6 text-emerald-600" /></div>
              <h3 className="font-semibold text-gray-800 mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-600">Automatic topic extraction, sentiment analysis, and credibility scoring</p>
            </Card>
            <Card className="text-center p-6 border-none shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"><Sparkles className="w-6 h-6 text-orange-600" /></div>
              <h3 className="font-semibold text-gray-800 mb-2">Smart Summaries</h3>
              <p className="text-sm text-gray-600">Concise AI-generated summaries for quick understanding</p>
            </Card>
            <Card className="text-center p-6 border-none shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><Clock className="w-6 h-6 text-blue-600" /></div>
              <h3 className="font-semibold text-gray-800 mb-2">Reading Time</h3>
              <p className="text-sm text-gray-600">Estimated reading time and key entity extraction</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
