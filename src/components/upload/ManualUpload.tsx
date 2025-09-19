import React, { useState } from 'react';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Edit, User as UserIcon, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ManualUpload({ onSubmit }: { onSubmit: (data: { title: string; content: string; author?: string; source_url?: string; published_date?: string }) => void }) {
  const [formData, setFormData] = useState({ title: '', content: '', author: '', source_url: '', published_date: '' });

  const handleChange = (field: keyof typeof formData, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (formData.title.trim() && formData.content.trim()) onSubmit(formData); };
  const isValid = formData.title.trim() && formData.content.trim();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4"><Edit className="w-10 h-10 text-orange-600" /></div>
        <h3 className="text-2xl font-semibold text-gray-800 mb-2">Manual Entry</h3>
        <p className="text-gray-600">Enter article details manually for full control over the content</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="title" className="text-lg font-medium">Article Title *</label>
            <Input id="title" value={formData.title} onChange={e=>handleChange('title', e.target.value)} placeholder="Enter the article title" className="py-3 text-lg border" />
          </div>
          <div className="space-y-2">
            <label htmlFor="author" className="text-lg font-medium">Author</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input id="author" value={formData.author} onChange={e=>handleChange('author', e.target.value)} placeholder="Author name" className="pl-11 py-3 text-lg border" />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="source_url" className="text-lg font-medium">Source URL</label>
            <Input id="source_url" type="url" value={formData.source_url} onChange={e=>handleChange('source_url', e.target.value)} placeholder="https://example.com/article" className="py-3 text-lg border" />
          </div>
          <div className="space-y-2">
            <label htmlFor="published_date" className="text-lg font-medium">Published Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input id="published_date" type="date" value={formData.published_date} onChange={e=>handleChange('published_date', e.target.value)} className="pl-11 py-3 text-lg border" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="content" className="text-lg font-medium">Article Content *</label>
          <Textarea id="content" value={formData.content} onChange={e=>handleChange('content', e.target.value)} placeholder="Paste or type the full article content here..." rows={12} className="text-lg border leading-relaxed" />
          <p className="text-sm text-gray-500">{formData.content.length} characters • ~{Math.ceil(formData.content.length / 1000)} min read</p>
        </div>

        <Button type="submit" disabled={!isValid} className="w-full bg-emerald-600 hover:bg-emerald-700 py-4 text-lg font-medium disabled:opacity-50">
          Process Article <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </form>
    </motion.div>
  );
}
