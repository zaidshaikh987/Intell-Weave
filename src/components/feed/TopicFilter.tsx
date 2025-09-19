import React from 'react';
import Button from '@/components/ui/button';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Clock, Sparkles, X } from 'lucide-react';
import { ArticleType } from '@/entities/all';

export default function TopicFilter({ selectedTopics, onTopicsChange, articles, filter, onFilterChange }: {
  selectedTopics: string[];
  onTopicsChange: (t: string[]) => void;
  articles: ArticleType[];
  filter: 'all'|'trending'|'recent';
  onFilterChange: (f: 'all'|'trending'|'recent') => void;
}) {
  const allTopics = Array.from(new Set(articles.flatMap(a => a.topics || [])));

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) onTopicsChange(selectedTopics.filter(t => t !== topic));
    else onTopicsChange([...selectedTopics, topic]);
  };
  const clearTopics = () => onTopicsChange([]);

  return (
    <Card className="mb-6 border">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => onFilterChange('all')}
              className={`font-bold ${filter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              All Articles
            </Button>
            <Button
              variant={filter === 'trending' ? 'default' : 'outline'}
              onClick={() => onFilterChange('trending')}
              className={`font-bold ${filter === 'trending' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </Button>
            <Button
              variant={filter === 'recent' ? 'default' : 'outline'}
              onClick={() => onFilterChange('recent')}
              className={`font-bold ${filter === 'recent' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
            >
              <Clock className="w-4 h-4 mr-2" />
              Recent
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selectedTopics.length > 0 && (
              <>
                <span className="text-sm text-gray-600 font-medium">Filtered by:</span>
                {selectedTopics.map((topic, idx) => (
                  <Badge key={idx} className="bg-emerald-200 text-emerald-800 pr-1 cursor-pointer" onClick={() => toggleTopic(topic)}>
                    {topic}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={clearTopics} className="text-gray-600 hover:text-gray-800 font-medium">Clear all</Button>
              </>
            )}
          </div>
        </div>

        {allTopics.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">Available topics:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTopics.slice(0, 12).map((topic, index) => (
                <Button key={index} variant="outline" size="sm" onClick={() => toggleTopic(topic)} className={`text-xs transition-all font-medium ${selectedTopics.includes(topic) ? 'bg-emerald-200 text-emerald-800' : ''}`}>
                  {topic}
                  <span className="ml-1 text-gray-400">({articles.filter(a => a.topics?.includes(topic)).length})</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
