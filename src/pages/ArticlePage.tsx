import React, { useEffect, useState } from 'react';
import { Article as ArticleEntity, ArticleType } from '@/entities/all';
import Badge from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Clock, User as UserIcon, BarChart, TrendingUp, Play, Share2, Bookmark, Globe, BrainCircuit } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';

export default function ArticlePage() {
  const [article, setArticle] = useState<ArticleType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const loadArticle = async () => {
      const params = new URLSearchParams(location.search);
      const articleId = params.get('id');
      if (articleId) {
        const found = await ArticleEntity.get(articleId);
        setArticle(found || null);
      }
      setIsLoading(false);
    };
    loadArticle();
  }, [location.search]);

  if (isLoading) return <div className="p-8 text-center font-bold text-2xl">Loading Article...</div>;
  if (!article) return <div className="p-8 text-center font-bold text-2xl">Article not found.</div>;

  const sentimentColors: Record<string,string> = {
    positive: 'bg-green-200 text-green-800',
    negative: 'bg-red-200 text-red-800',
    neutral: 'bg-yellow-200 text-yellow-800'
  };

  const safeHtml = DOMPurify.sanitize((article.content || '').replace(/\n/g, '<br />'));

  return (
    <div className="bg-white min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(article.topics || []).map(topic => (
              <Badge key={topic} className="bg-yellow-300 text-black border">{topic}</Badge>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-black leading-tight">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-600 font-medium">
            {article.author && (<div className="flex items-center gap-2"><UserIcon /> {article.author}</div>)}
            <div className="flex items-center gap-2"><Clock /> {format(new Date(article.published_date || article.created_date || Date.now()), 'MMMM d, yyyy')}</div>
            {article.reading_time && (<div className="flex items-center gap-2"><BarChart /> {article.reading_time} min read</div>)}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {article.image_url && (
              <div className="rounded-lg overflow-hidden border mb-8">
                <img src={article.image_url} alt={article.title} className="w-full h-auto object-cover" />
              </div>
            )}
            {article.summary && (<p className="text-xl text-gray-700 font-medium leading-relaxed">{article.summary}</p>)}
            <div className="prose prose-lg max-w-none text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: safeHtml }} />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-bold"><BrainCircuit/> AI Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm uppercase text-gray-500 mb-2">Credibility</h4>
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-6 h-6 ${article.credibility_score && article.credibility_score>75 ? 'text-green-500' : 'text-orange-500'}`} />
                    <p className="text-2xl font-bold">{article.credibility_score ?? 0}%</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm uppercase text-gray-500 mb-2">Sentiment</h4>
                  {article.sentiment && (
                    <Badge className={`${sentimentColors[article.sentiment]} border text-md capitalize`}>{article.sentiment}</Badge>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm uppercase text-gray-500 mb-2">Key Entities</h4>
                  <div className="flex flex-wrap gap-2">
                    {(article.key_entities || []).map(e => (
                      <Badge key={e.name} variant="secondary" className="border">{e.name} ({e.type})</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex flex-col gap-2">
                <Button variant="outline" className="w-full justify-start"><Play className="mr-2"/> Listen to Summary</Button>
                <Button variant="outline" className="w-full justify-start"><Bookmark className="mr-2"/> Bookmark Article</Button>
                <Button variant="outline" className="w-full justify-start"><Share2 className="mr-2"/> Share Article</Button>
                {article.source_url && (
                  <a href={article.source_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full justify-start"><Globe className="mr-2"/> View Original Source</Button>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
