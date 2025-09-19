import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Brain, FileText, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProcessingStatus({ progress, message, success, error }: { progress: number; message: string; success: boolean; error: string; }) {
  const getIcon = () => {
    if (success) return <CheckCircle className="w-8 h-8 text-emerald-600" />;
    if (error) return <AlertCircle className="w-8 h-8 text-red-600" />;
    if (progress < 30) return <FileText className="w-8 h-8 text-blue-600" />;
    if (progress < 70) return <Brain className="w-8 h-8 text-purple-600" />;
    return <Sparkles className="w-8 h-8 text-emerald-600" />;
  };

  const getStatusColor = () => (success ? 'text-emerald-600' : error ? 'text-red-600' : 'text-gray-700');

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-8">
      <Card className="border-none shadow bg-white/95">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              {getIcon()}
              {!success && !error && (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="absolute -inset-2 border-2 border-transparent border-t-emerald-300 rounded-full" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className={`text-2xl font-semibold ${getStatusColor()}`}>{success ? 'Article Processed Successfully!' : error ? 'Processing Failed' : 'Processing Article...'}</h3>
              <p className="text-gray-600 text-lg">{message}</p>
            </div>
            {!success && !error && (
              <div className="w-full max-w-md space-y-2">
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 w-full max-w-md">
                <p className="text-emerald-700 text-sm">Your article has been analyzed and added to your feed. Redirecting...</p>
              </div>
            )}
            {!success && !error && (
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className={`flex items-center gap-2 ${progress >= 10 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${progress >= 10 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                  Upload
                </div>
                <div className={`flex items-center gap-2 ${progress >= 40 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${progress >= 40 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                  Extract
                </div>
                <div className={`flex items-center gap-2 ${progress >= 70 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${progress >= 70 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                  Analyze
                </div>
                <div className={`flex items-center gap-2 ${progress >= 100 ? 'text-emerald-600' : 'text-gray-400'}`}>
                  <div className={`w-2 h-2 rounded-full ${progress >= 100 ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                  Save
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
