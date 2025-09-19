import React, { useEffect, useState } from 'react';
import { Article as ArticleEntity, ArticleType, UserProfile as UserProfileEntity, UserProfileType } from '@/entities/all';
import { User } from '@/entities/User';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Eye, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PersonalizedBanner from '@/components/feed/PersonalizedBanner';
import ArticleCard from '@/components/feed/ArticleCard';
import TopicFilter from '@/components/feed/TopicFilter';
import TrendingTopics from '@/components/feed/TrendingTopics';

export default function FeedPage() {
  const [articles, setArticles] = useState<ArticleType[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'trending'|'recent'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const profiles = await UserProfileEntity.filter({ created_by: currentUser.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
        setSelectedTopics(profiles[0].preferred_topics || []);
      }
      const allArticles = await ArticleEntity.list('-created_date', 50);
      setArticles(allArticles);
    } catch (e) {
      const allArticles = await ArticleEntity.list('-created_date', 50);
      setArticles(allArticles);
    }
    setIsLoading(false);
  };

  const filteredArticles = articles.filter(a => {
    if (selectedTopics.length === 0) return true;
    const topics = a.topics || [];
    return topics.some(topic => selectedTopics.some(sel => sel.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(sel.toLowerCase())));
  });

  const sortedArticles = [...filteredArticles].sort((a,b) => {
    if (filter === 'trending') return (b.credibility_score||0) - (a.credibility_score||0);
    // default: recent
    return new Date(b.created_date || b.published_date || 0).getTime() - new Date(a.created_date || a.published_date || 0).getTime();
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8 p-6 bg-yellow-300 border border-black">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-black mb-2">Your Intelligence Feed</h1>
              <p className="text-gray-700 font-medium">{user ? `Welcome back, ${user.full_name || user.email}` : 'Discover the stories that matter'}</p>
            </div>
            <div className="flex items-center gap-3 bg-white/50 p-2 rounded-md border border-black">
              <div className="flex items-center gap-2 text-sm text-black font-bold">
                <Eye className="w-4 h-4" />
                <span>{sortedArticles.length} articles</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-black font-bold">
                <Clock className="w-4 h-4" />
                <span>Updated {format(new Date(), 'HH:mm')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <PersonalizedBanner user={user} userProfile={userProfile} onUpdatePreferences={loadData} />
            <TopicFilter selectedTopics={selectedTopics} onTopicsChange={setSelectedTopics} articles={articles} filter={filter} onFilterChange={setFilter} />
            <AnimatePresence mode="wait">
              {isLoading ? (
                <div className="space-y-6">
                  {Array.from({length:6}).map((_,i)=> (
                    <Card key={i} className="bg-gray-100">
                      <CardHeader>
                        <div className="h-4 bg-gray-300 rounded w-3/4" />
                        <div className="h-3 bg-gray-300 rounded w-1/2 mt-2" />
                      </CardHeader>
                      <CardContent>
                        <div className="h-20 bg-gray-300 rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {sortedArticles.map((article, index) => (
                    <ArticleCard key={article.id} article={article} index={index} user={user || undefined} />
                  ))}

                  {sortedArticles.length === 0 && (
                    <Card className="text-center py-12 bg-white">
                      <CardContent>
                        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-black mb-2">No articles found</h3>
                        <p className="text-gray-600 mb-4">{selectedTopics.length>0 ? 'Try adjusting your topic filters or upload some articles.' : 'Upload some articles to build your personalized feed.'}</p>
                        <Link to={createPageUrl('Upload')}>
                          <Button className="bg-yellow-400 text-black font-bold border border-black">Upload Articles</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <TrendingTopics articles={articles} />
            {user && (
              <Card className="mt-6 bg-white">
                <CardHeader>
                  <h3 className="font-bold text-black">Your Reading Stats</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-sm text-gray-600">Articles read today</span>
                    <Badge className="bg-green-200 text-green-800">12</Badge>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-sm text-gray-600">Reading time</span>
                    <Badge className="bg-yellow-200 text-yellow-800">2h 15m</Badge>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-sm text-gray-600">Streak</span>
                    <Badge className="bg-gray-200 text-gray-700">7 days</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
