import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import { TrendingUp, ArrowUp, Flame } from 'lucide-react';
import { ArticleType } from '@/entities/all';
import api from '@/api/client';

type TrendRow = { topic: string; cnt: number; avg_cred: number };

export default function TrendingTopics({ articles }: { articles?: ArticleType[] }) {
  const [serverTrends, setServerTrends] = React.useState<TrendRow[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const rows = await api.get<TrendRow[]>(`/topics/trending?limit=8&days=7`);
        setServerTrends(rows);
      } catch (e) {
        setServerTrends(null);
        setError('');
      }
    })();
  }, []);

  const topicStats = React.useMemo(() => {
    if (serverTrends && serverTrends.length>0) {
      return serverTrends.map(r => ({ topic: r.topic, count: r.cnt, avgScore: r.avg_cred }));
    }
    const src = articles || [];
    const topicCount: Record<string, number> = {};
    const topicScore: Record<string, number> = {};
    src.forEach(a => {
      (a.topics || []).forEach(t => {
        topicCount[t] = (topicCount[t] || 0) + 1;
        topicScore[t] = (topicScore[t] || 0) + (a.credibility_score || 50);
      });
    });
    return Object.entries(topicCount)
      .map(([topic, count]) => ({ topic, count, avgScore: (topicScore[topic] || 0) / count }))
      .sort((a,b)=> b.count - a.count)
      .slice(0,8);
  }, [serverTrends, articles]);

  return (
    <Card className="border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-bold">
          <Flame className="w-5 h-5 text-orange-500" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topicStats.map(({ topic, count, avgScore }, index) => (
          <div key={topic} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${index===0?'bg-emerald-200 text-emerald-800': index===1?'bg-orange-200 text-orange-800': index===2? 'bg-gray-200 text-gray-800':'bg-gray-100 text-gray-600'}`}>{index+1}</div>
              <div>
                <p className="font-medium text-gray-800 text-sm">{topic}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{count} articles</span>
                  {avgScore >= 70 && (<Badge className="bg-emerald-200 text-emerald-800 text-xs px-1 py-0">High Quality</Badge>)}
                </div>
              </div>
            </div>
            <ArrowUp className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100" />
          </div>
        ))}
        {topicStats.length===0 && (
          <div className="text-center py-6 text-gray-500">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No trending topics yet</p>
            <p className="text-xs">Upload some articles to see trends</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
