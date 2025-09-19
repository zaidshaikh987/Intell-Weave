import React, { useEffect, useState } from 'react';
import { BookmarkedArticle as BookmarkedArticleEntity, Article as ArticleEntity, ArticleType } from '@/entities/all';
import { User } from '@/entities/User';
import ArticleCard from '@/components/feed/ArticleCard';
import { Bookmark, Frown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function BookmarksPage() {
  const [bookmarkedArticles, setBookmarkedArticles] = useState<ArticleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null);

  useEffect(() => {
    const loadBookmarks = async () => {
      setIsLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        const bookmarks = await BookmarkedArticleEntity.filter({ created_by: currentUser.email });
        const allArticles = await ArticleEntity.list();
        const articles = allArticles.filter(a => bookmarks.some(b => b.article_id === a.id));
        setBookmarkedArticles(articles);
      } catch (e) {
        console.error('Error loading bookmarks:', e);
      }
      setIsLoading(false);
    };
    loadBookmarks();
  }, []);

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 p-6 bg-yellow-300 border">
          <div className="flex items-center gap-4">
            <Bookmark className="w-12 h-12 text-black" />
            <div>
              <h1 className="text-4xl font-extrabold text-black">My Bookmarks</h1>
              <p className="text-gray-700 font-medium">Your collection of saved articles for later reading.</p>
            </div>
          </div>
        </div>

        {isLoading && <div className="text-center font-bold">Loading your bookmarks...</div>}

        {!isLoading && user && bookmarkedArticles.length > 0 && (
          <div className="space-y-6">
            {bookmarkedArticles.map((a,idx)=> (<ArticleCard key={a.id} article={a} index={idx} user={user} />))}
          </div>
        )}

        {!isLoading && (!user || bookmarkedArticles.length === 0) && (
          <Card className="text-center py-16 bg-gray-50 border rounded-lg">
            <CardContent>
              <Frown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-black">No Bookmarks Yet</h3>
              <p className="text-gray-600 mb-4">{user ? 'Start browsing and save articles you find interesting.' : 'Sign in to save articles.'}</p>
              <Link to={createPageUrl('Feed')}><Button className="bg-yellow-400 text-black border">{user ? 'Explore Feed' : 'Sign In'}</Button></Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
