import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { BookmarkedArticle, ArticleType } from '@/entities/all';
import { Clock, User as UserIcon, TrendingUp, Play, Bookmark, BookmarkCheck, Share, ExternalLink, Eye, ThumbsUp, MessageCircle, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import api from '@/api/client';

const sentimentColors: Record<string, string> = {
  positive: 'bg-emerald-100 text-emerald-700',
  negative: 'bg-red-100 text-red-700',
  neutral: 'bg-gray-100 text-gray-700'
};
const sentimentIcons: Record<string, string> = { positive: '📈', negative: '📉', neutral: '➖' };

export default function ArticleCard({ article, index, user }: { article: ArticleType; index: number; user?: { email: string } }) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [sentImpression, setSentImpression] = useState(false);

  useEffect(() => {
    // Initialize bookmark state from storage
    (async () => {
      const created_by = user?.email || 'guest@example.com';
      const list = await BookmarkedArticle.filter({ created_by });
      setIsBookmarked(list.some(b => b.article_id === article.id));
    })();
  }, [user, article.id]);

  // Visibility-based impressions (50% threshold)
  useEffect(() => {
    if (!cardRef.current || sentImpression) return;
    const el = cardRef.current;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !sentImpression) {
          setSentImpression(true);
          (async () => { try { await api.post('/events', { event_type: 'impression', article_id: article.id, properties: { component: 'ArticleCard', ratio: entry.intersectionRatio } }); } catch {} })();
          observer.unobserve(el);
        }
      });
    }, { threshold: [0.5] });
    observer.observe(el);
    return () => { observer.disconnect(); };
  }, [cardRef, sentImpression, article.id]);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const created_by = user?.email || 'guest@example.com';
    setIsBookmarking(true);
    try {
      if (isBookmarked) {
        await BookmarkedArticle.deleteByArticleId(article.id, created_by);
        setIsBookmarked(false);
      } else {
        await BookmarkedArticle.create({ article_id: article.id, notes: '', created_by });
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Error bookmarking article:', err);
    }
    setIsBookmarking(false);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (async () => { try { await api.post('/events', { event_type: 'share', article_id: article.id }); } catch {} })();
    if (navigator.share && article.source_url) {
      navigator.share({ title: article.title, text: article.summary, url: article.source_url });
    } else {
      navigator.clipboard.writeText(article.source_url || window.location.href);
    }
  };
  const handleClick = () => {
    (async () => { try { await api.post('/events', { event_type: 'click', article_id: article.id }); } catch {} })();
  };

  return (
    <motion.div ref={cardRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className="bg-white">
        <Link to={createPageUrl(`Article`) + `?id=${encodeURIComponent(article.id)}` } onClick={handleClick}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {article.source_url && (
                    <Badge variant="outline" className="text-xs"><ExternalLink className="w-3 h-3 mr-1" /> Source</Badge>
                  )}
                  {typeof article.credibility_score === 'number' && (
                    <Badge className={`text-xs ${article.credibility_score >= 80 ? 'bg-emerald-100 text-emerald-700' : article.credibility_score >= 60 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                      {article.credibility_score >= 80 ? <CheckCircle className="w-3 h-3 mr-1" /> : 
                       article.credibility_score >= 60 ? <AlertTriangle className="w-3 h-3 mr-1" /> : 
                       <Shield className="w-3 h-3 mr-1" />}
                      {article.credibility_score}% credible
                    </Badge>
                  )}
                  {article.sentiment && (
                    <Badge className={`text-xs ${sentimentColors[article.sentiment]}`}>
                      <span className="mr-1">{sentimentIcons[article.sentiment]}</span>{article.sentiment}
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold text-black leading-tight">{article.title}</h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-2 font-medium">
                  {article.author && (<div className="flex items-center gap-1"><UserIcon className="w-4 h-4" /><span>{article.author}</span></div>)}
                  <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{format(new Date(article.published_date || article.created_date || Date.now()), 'MMM d, HH:mm')}</span></div>
                  {article.reading_time && (<div className="flex items-center gap-1"><Eye className="w-4 h-4" /><span>{article.reading_time} min read</span></div>)}
                </div>
              </div>
              {article.image_url && (
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border">
                  <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {article.summary && (<p className="text-gray-700 line-clamp-3 mb-4 leading-relaxed">{article.summary}</p>)}
            {article.topics && article.topics.length>0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {article.topics.slice(0,4).map((t,i)=>(<Badge key={i} variant="secondary" className="text-xs bg-gray-100 text-gray-700">{t}</Badge>))}
                {article.topics.length>4 && (<Badge variant="secondary" className="text-xs">+{article.topics.length-4} more</Badge>)}
              </div>
            )}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                {article.audio_url && (
                  <Button variant="outline" size="sm" onClick={(e)=>{e.preventDefault(); e.stopPropagation();}} className="font-bold"> <Play className="w-4 h-4" /> Listen </Button>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-500 font-medium"><ThumbsUp className="w-4 h-4" /><span>24</span></div>
                <div className="flex items-center gap-1 text-sm text-gray-500 font-medium"><MessageCircle className="w-4 h-4" /><span>8</span></div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handleShare}><Share className="w-5 h-5 text-gray-600" /></Button>
                {user && (
                  <Button variant="ghost" size="icon" onClick={handleBookmark} disabled={isBookmarking} className={isBookmarked ? 'text-emerald-700' : 'text-gray-600'}>
                    {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
}
