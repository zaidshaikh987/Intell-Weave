import React, { useEffect, useState } from 'react';
import { Article as ArticleEntity, ArticleType } from '@/entities/all';
import { User } from '@/entities/User';
import ArticleCard from '@/components/feed/ArticleCard';
import { Compass, Zap, BrainCircuit } from 'lucide-react';

export default function DiscoverPage() {
  const [articles, setArticles] = useState<ArticleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<'trending'|'newest'|'all'>('trending');
  const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null);

  useEffect(() => {
    const loadArticles = async () => {
      setIsLoading(true);
      let fetched: ArticleType[];
      if (sort === 'trending') fetched = await ArticleEntity.list('-credibility_score', 20);
      else if (sort === 'newest') fetched = await ArticleEntity.list('-created_date', 20);
      else fetched = await ArticleEntity.list('', 20);
      setArticles(fetched);
      setIsLoading(false);
    };
    const loadUser = async () => { setUser(await User.me()); };
    loadArticles();
    loadUser();
  }, [sort]);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 p-6 bg-green-300 border">
          <div className="flex items-center gap-4">
            <Compass className="w-12 h-12 text-black" />
            <div>
              <h1 className="text-4xl font-extrabold text-black">Discover</h1>
              <p className="text-gray-700 font-medium">Explore trending, top-rated, and fresh content from across the web.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <h2 className="font-bold text-lg text-black">Sort by:</h2>
          <button onClick={()=>setSort('trending')} className={`px-4 py-2 font-bold border rounded-md ${sort==='trending' ? 'bg-yellow-300' : 'bg-white hover:bg-gray-100'}`}>
            <Zap className="w-4 h-4 mr-2 inline"/> Trending
          </button>
          <button onClick={()=>setSort('newest')} className={`px-4 py-2 font-bold border rounded-md ${sort==='newest' ? 'bg-yellow-300' : 'bg-white hover:bg-gray-100'}`}>
            <BrainCircuit className="w-4 h-4 mr-2 inline"/> Newest
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({length:9}).map((_,i)=> (
              <div key={i} className="h-64 bg-gray-200 rounded-lg border animate-pulse" />
            ))
          ) : (
            articles.map((a,idx)=> (<ArticleCard key={a.id} article={a} index={idx} user={user || undefined} />))
          )}
        </div>
      </div>
    </div>
  );
}
