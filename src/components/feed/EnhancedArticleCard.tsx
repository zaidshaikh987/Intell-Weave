import React, { useState } from 'react';
import { 
  Clock, 
  User, 
  ExternalLink, 
  Bookmark, 
  Share2, 
  Volume2, 
  Video, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Eye,
  MessageSquare
} from 'lucide-react';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  source_url: string;
  published_at: string;
  reading_time?: number;
  summary?: string;
  credibility_score?: number;
  sentiment?: {
    compound: number;
    positive: number;
    negative: number;
    neutral: number;
  };
  topics?: string[];
  recommendation_score?: number;
  has_audio?: boolean;
  has_video?: boolean;
  media_count?: number;
}

interface EnhancedArticleCardProps {
  article: Article;
  onBookmark?: (articleId: string) => void;
  onShare?: (article: Article) => void;
  onPlayAudio?: (articleId: string) => void;
  onViewVideo?: (articleId: string) => void;
  onViewArticle?: (articleId: string) => void;
  isBookmarked?: boolean;
}

export default function EnhancedArticleCard({
  article,
  onBookmark,
  onShare,
  onPlayAudio,
  onViewVideo,
  onViewArticle,
  isBookmarked = false
}: EnhancedArticleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCredibilityBadge = (score?: number) => {
    if (!score) return null;
    
    if (score >= 0.8) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Highly Credible
        </div>
      );
    } else if (score >= 0.6) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
          <Shield className="w-3 h-3" />
          Credible
        </div>
      );
    } else if (score >= 0.4) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
          <AlertTriangle className="w-3 h-3" />
          Questionable
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
          <AlertTriangle className="w-3 h-3" />
          Low Credibility
        </div>
      );
    }
  };

  const getSentimentColor = (sentiment?: Article['sentiment']) => {
    if (!sentiment) return 'text-gray-500';
    
    const { compound } = sentiment;
    if (compound >= 0.1) return 'text-green-600';
    if (compound <= -0.1) return 'text-red-600';
    return 'text-gray-600';
  };

  const getSentimentLabel = (sentiment?: Article['sentiment']) => {
    if (!sentiment) return 'Neutral';
    
    const { compound } = sentiment;
    if (compound >= 0.1) return 'Positive';
    if (compound <= -0.1) return 'Negative';
    return 'Neutral';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSourceDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'Unknown source';
    }
  };

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Header with credibility and metadata */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {getCredibilityBadge(article.credibility_score)}
            
            {article.recommendation_score && article.recommendation_score > 0.8 && (
              <div className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                Recommended for you
              </div>
            )}
            
            <div className={`text-xs font-medium ${getSentimentColor(article.sentiment)}`}>
              {getSentimentLabel(article.sentiment)}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {article.has_audio && (
              <button
                onClick={() => onPlayAudio?.(article.id)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Play audio briefing"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            )}
            
            {article.has_video && (
              <button
                onClick={() => onViewVideo?.(article.id)}
                className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                title="View video content"
              >
                <Video className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 
          className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => onViewArticle?.(article.id)}
        >
          {article.title}
        </h2>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {article.subtitle}
          </p>
        )}

        {/* Summary */}
        {article.summary && (
          <div className="mb-3">
            <p className={`text-gray-700 text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>
              {article.summary}
            </p>
            {article.summary.length > 200 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Topics */}
        {article.topics && article.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {article.topics.slice(0, 3).map((topic, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
              >
                {topic}
              </span>
            ))}
            {article.topics.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                +{article.topics.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {/* Author */}
            {article.author && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{article.author}</span>
              </div>
            )}

            {/* Source */}
            <div className="flex items-center gap-1">
              <ExternalLink className="w-4 h-4" />
              <span>{getSourceDomain(article.source_url)}</span>
            </div>

            {/* Time */}
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatTimeAgo(article.published_at)}</span>
            </div>

            {/* Reading time */}
            {article.reading_time && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{article.reading_time} min read</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBookmark?.(article.id)}
              className={`p-2 rounded-full transition-colors ${
                isBookmarked
                  ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => onShare?.(article)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Share article"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onViewArticle?.(article.id)}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Read Full Article
            </button>
          </div>
        </div>

        {/* Credibility details */}
        {article.credibility_score && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Credibility Score</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${
                      article.credibility_score >= 0.8
                        ? 'bg-green-500'
                        : article.credibility_score >= 0.6
                        ? 'bg-blue-500'
                        : article.credibility_score >= 0.4
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${article.credibility_score * 100}%` }}
                  />
                </div>
                <span className="font-medium">
                  {(article.credibility_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
