import React, { useState } from 'react';
import { ArticleType } from '@/entities/all';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import ArticleCard from '@/components/feed/ArticleCard';
import { Search as SearchIcon, X, Frown } from 'lucide-react';
import api from '@/api/client';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ArticleType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [mode, setMode] = useState<'text'|'vector'>('text');
  const [source, setSource] = useState('');
  const [language, setLanguage] = useState('');
  const [minCred, setMinCred] = useState<number|''>('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams();
      params.set('q', searchTerm);
      if (source) params.set('source', source);
      if (language) params.set('language', language);
      if (minCred !== '') params.set('min_cred', String(minCred));
      const path = mode === 'vector' ? `/search/vector?${params.toString()}` : `/search?${params.toString()}`;
      const data = await api.get<ArticleType[]>(path);
      setResults(data);
    } catch (err) {
      setResults([]);
    }
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-black mb-2">Search Articles</h1>
          <p className="text-gray-600 text-lg">Find exactly what you're looking for.</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col gap-3 mb-10">
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-md border cursor-pointer ${mode==='text'?'bg-yellow-200 border-black':'bg-white'}`} onClick={()=>setMode('text')}>Text</div>
            <div className={`px-3 py-1 rounded-md border cursor-pointer ${mode==='vector'?'bg-yellow-200 border-black':'bg-white'}`} onClick={()=>setMode('vector')}>Vector</div>
          </div>
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <Input type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} placeholder="Search by keyword, topic, or title..." className="w-full pl-14 pr-12 py-3 border" />
            {searchTerm && (
              <button type="button" onClick={()=>setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="Source contains..." value={source} onChange={e=>setSource(e.target.value)} className="border" />
            <Input placeholder="Language (e.g., en)" value={language} onChange={e=>setLanguage(e.target.value)} className="border" />
            <Input placeholder="Min credibility (0-100)" value={minCred} onChange={e=> setMinCred(e.target.value as any)} className="border" />
          </div>
          <Button type="submit" disabled={isSearching} className="px-6 self-start">{isSearching ? '...' : 'Search'}</Button>
        </form>

        {isSearching && <div className="text-center font-bold">Searching...</div>}

        {!isSearching && hasSearched && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-black">{results.length} results found for "{searchTerm}"</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 text-xs border rounded">Mode: {mode}</span>
              {source && <span className="px-2 py-1 text-xs border rounded">source:{source}</span>}
              {language && <span className="px-2 py-1 text-xs border rounded">lang:{language}</span>}
              {minCred!=='' && <span className="px-2 py-1 text-xs border rounded">minCred:{minCred}</span>}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {results.length>0 ? (
            results.map((a,idx)=> (<ArticleCard key={a.id} article={a} index={idx} />))
          ) : hasSearched && !isSearching ? (
            <div className="text-center py-16 bg-gray-50 border rounded-lg">
              <Frown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-black">No Results Found</h3>
              <p className="text-gray-600">Try a different search term.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
