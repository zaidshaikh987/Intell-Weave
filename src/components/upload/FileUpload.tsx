import React, { useRef, useState } from 'react';
import Button from '@/components/ui/button';
import { Upload as UploadIcon, FileText, Image, File as FileIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FileUpload({ onUpload }: { onUpload: (file: File) => void }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) onUpload(files[0]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onUpload(files[0]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${dragActive ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'}`}
      >
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.html,.md,image/*" onChange={handleFileSelect} className="hidden" />
        <div className="space-y-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto"><UploadIcon className="w-10 h-10 text-emerald-600" /></div>
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">Upload Article File</h3>
            <p className="text-gray-600 mb-6">Drag and drop your file here, or click to browse</p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 text-lg">Choose File</Button>
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2"><FileText className="w-4 h-4" /><span>PDF, DOC, TXT</span></div>
            <div className="flex items-center gap-2"><Image className="w-4 h-4" /><span>Images</span></div>
            <div className="flex items-center gap-2"><FileIcon className="w-4 h-4" /><span>HTML, MD</span></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
