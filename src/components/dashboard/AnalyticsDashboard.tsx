import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Eye, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';

interface DashboardMetrics {
  totalArticles: number;
  totalUsers: number;
  dailyViews: number;
  avgCredibilityScore: number;
  processingQueue: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  crawlSuccess: number;
  indexLag: number;
  responseTime: number;
}

interface TrendData {
  date: string;
  articles: number;
  views: number;
  engagement: number;
}

interface TopicDistribution {
  topic: string;
  count: number;
  percentage: number;
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [topics, setTopics] = useState<TopicDistribution[]>([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch metrics
      const metricsResponse = await fetch(`/api/admin/metrics?range=${timeRange}`);
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch trends
      const trendsResponse = await fetch(`/api/admin/trends?range=${timeRange}`);
      const trendsData = await trendsResponse.json();
      setTrends(trendsData);

      // Fetch topic distribution
      const topicsResponse = await fetch(`/api/admin/topics?range=${timeRange}`);
      const topicsData = await topicsResponse.json();
      setTopics(topicsData);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <AlertTriangle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = 'blue' 
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: number;
    color?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              trend >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${trend < 0 ? 'rotate-180' : ''}`} />
              {Math.abs(trend)}% vs last period
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  if (loading && !metrics) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 h-64 rounded-lg"></div>
            <div className="bg-gray-200 h-64 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor system performance and content metrics</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          {metrics && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
              getHealthColor(metrics.systemHealth)
            }`}>
              {getHealthIcon(metrics.systemHealth)}
              System {metrics.systemHealth}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Articles"
            value={formatNumber(metrics.totalArticles)}
            icon={FileText}
            trend={12}
            color="blue"
          />
          <MetricCard
            title="Active Users"
            value={formatNumber(metrics.totalUsers)}
            icon={Users}
            trend={8}
            color="green"
          />
          <MetricCard
            title="Daily Views"
            value={formatNumber(metrics.dailyViews)}
            icon={Eye}
            trend={-3}
            color="purple"
          />
          <MetricCard
            title="Avg Credibility"
            value={`${(metrics.avgCredibilityScore * 100).toFixed(1)}%`}
            icon={Shield}
            trend={2}
            color="orange"
          />
        </div>
      )}

      {/* System Health Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Crawl Success Rate</h3>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Success Rate</span>
                <span className="font-medium">{metrics.crawlSuccess}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${metrics.crawlSuccess}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Processing Queue</h3>
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.processingQueue}
              </div>
              <div className="text-sm text-gray-600">articles pending</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Response Time</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-gray-900">
                {metrics.responseTime}ms
              </div>
              <div className="text-sm text-gray-600">p95 latency</div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Content Trends</h3>
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          
          {trends.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Date</span>
                <span>Articles</span>
                <span>Views</span>
                <span>Engagement</span>
              </div>
              {trends.slice(-7).map((trend, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm font-medium">
                    {new Date(trend.date).toLocaleDateString()}
                  </span>
                  <span className="text-sm">{trend.articles}</span>
                  <span className="text-sm">{formatNumber(trend.views)}</span>
                  <span className="text-sm">{trend.engagement}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No trend data available</p>
            </div>
          )}
        </div>

        {/* Topic Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Topic Distribution</h3>
            <PieChart className="w-5 h-5 text-purple-600" />
          </div>
          
          {topics.length > 0 ? (
            <div className="space-y-3">
              {topics.slice(0, 8).map((topic, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: `hsl(${(index * 45) % 360}, 70%, 60%)` 
                      }}
                    />
                    <span className="text-sm font-medium truncate">{topic.topic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{topic.count}</span>
                    <span className="text-sm font-medium">{topic.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No topic data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <Calendar className="w-5 h-5 text-gray-600" />
        </div>
        
        <div className="space-y-4">
          {[
            { time: '2 minutes ago', action: 'New article processed', details: 'Central Bank Signals Rate Pause', type: 'success' },
            { time: '5 minutes ago', action: 'Credibility assessment completed', details: '15 articles analyzed', type: 'info' },
            { time: '12 minutes ago', action: 'User engagement spike', details: '+25% in last hour', type: 'success' },
            { time: '18 minutes ago', action: 'Claim verification alert', details: 'Disputed claim detected', type: 'warning' },
            { time: '25 minutes ago', action: 'System health check', details: 'All systems operational', type: 'success' }
          ].map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.type === 'success' ? 'bg-green-500' :
                activity.type === 'warning' ? 'bg-yellow-500' :
                activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <span className="text-xs text-gray-500">{activity.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
