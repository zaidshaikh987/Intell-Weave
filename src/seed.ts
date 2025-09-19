import { ArticleType } from '@/entities/all';

export function seedIfEmpty() {
  const key = 'intellweave_articles';
  const existing = localStorage.getItem(key);
  if (existing) return;
  const now = new Date();
  const demo: ArticleType[] = [
    {
      id: 'art_demo_1',
      title: 'Central Bank Signals Rate Pause',
      source_url: 'https://news.example.com/central-bank-pause',
      published_date: new Date(now.getTime() - 1000*60*60).toISOString(),
      created_date: new Date(now.getTime() - 1000*60*30).toISOString(),
      content: 'The central bank today signaled a pause in rate hikes amid signs of cooling inflation and slowing growth...\nMarkets reacted positively as bond yields fell.',
      summary: 'Central bank signals a pause in rate hikes; markets rally on cooling inflation signals.',
      topics: ['economy','markets','monetary policy'],
      sentiment: 'neutral',
      credibility_score: 82,
      key_entities: [{ name: 'Central Bank', type: 'ORG', confidence: 0.9 }],
      reading_time: 2,
      image_url: ''
    },
    {
      id: 'art_demo_2',
      title: 'AI Model Sets New Benchmark in NLP Task',
      source_url: 'https://ml.example.com/new-benchmark',
      published_date: new Date(now.getTime() - 1000*60*120).toISOString(),
      created_date: new Date(now.getTime() - 1000*60*110).toISOString(),
      content: 'Researchers announced a new transformer-based model that achieves state-of-the-art on multiple NLP benchmarks...\nOpen-source release expected next quarter.',
      summary: 'New transformer-based model achieves SOTA on several NLP tasks; open-source release planned.',
      topics: ['technology','ai','nlp'],
      sentiment: 'positive',
      credibility_score: 75,
      key_entities: [{ name: 'Transformers', type: 'TECH' } as any],
      reading_time: 3,
      image_url: ''
    },
    {
      id: 'art_demo_3',
      title: 'Climate Report Highlights Rising Sea Levels',
      source_url: 'https://climate.example.com/sea-levels',
      published_date: new Date(now.getTime() - 1000*60*220).toISOString(),
      created_date: new Date(now.getTime() - 1000*60*210).toISOString(),
      content: 'A new climate report underscores the risk of rising sea levels impacting coastal cities over the next decades...\nPolicymakers urged to act swiftly.',
      summary: 'Rising sea levels threaten coastal regions; report urges swift policy action.',
      topics: ['climate','policy','science'],
      sentiment: 'negative',
      credibility_score: 68,
      key_entities: [{ name: 'IPCC', type: 'ORG' } as any],
      reading_time: 4,
      image_url: ''
    }
  ];
  localStorage.setItem(key, JSON.stringify(demo));
}
