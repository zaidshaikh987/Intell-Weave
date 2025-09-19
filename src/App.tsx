import { Routes, Route, Navigate } from 'react-router-dom';
import FeedPage from '@/pages/FeedPage';
import UploadPage from '@/pages/UploadPage';
import DiscoverPage from '@/pages/DiscoverPage';
import SearchPage from '@/pages/SearchPage';
import BookmarksPage from '@/pages/BookmarksPage';
import ArticlePage from '@/pages/ArticlePage';
import ChatPage from '@/pages/ChatPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import MediaPage from '@/pages/MediaPage';
import VerificationPage from '@/pages/VerificationPage';
import AppLayout from '@/components/layout/AppLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route element={<AppLayout />}>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/bookmarks" element={<BookmarksPage />} />
        <Route path="/article" element={<ArticlePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/media" element={<MediaPage />} />
        <Route path="/verification" element={<VerificationPage />} />
      </Route>
      <Route path="*" element={<div style={{padding:24}}>Not Found</div>} />
    </Routes>
  );
}
