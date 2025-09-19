import React, { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { Link as LinkIcon, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UrlUpload({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);

  const validateUrl = (s: string) => {
    try { const u = new URL(s); return u.protocol === 'http:' || u.protocol === 'https:'; } catch { return false; }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    setIsValidUrl(validateUrl(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidUrl) onSubmit(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"><Globe className="w-10 h-10 text-blue-600" /></div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Import from URL</h3>
        <p className="text-gray-600">Paste a link to any article and we'll fetch and analyze it for you</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="url" className="text-lg font-medium">Article URL</label>
          <div className="relative">
            <LinkIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input id="url" type="url" value={url} onChange={handleUrlChange} placeholder="https://example.com/article" className="pl-12 py-4 text-lg border" />
          </div>
          {url && !isValidUrl && (<p className="text-red-500 text-sm">Please enter a valid URL</p>)}
        </div>

        <Button type="submit" disabled={!isValidUrl} className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 text-lg font-medium">Fetch Article <ArrowRight className="w-5 h-5 ml-2" /></Button>
      </form>

      <div className="mt-8 p-4 bg-gray-50 rounded-xl">
        <h4 className="font-medium text-gray-800 mb-2">Supported Sources</h4>
        <p className="text-sm text-gray-600">We can extract content from most news websites, blogs, and article pages. The AI will automatically identify the main content and ignore navigation, ads, and other page elements.</p>
      </div>
    </motion.div>
  );
}
