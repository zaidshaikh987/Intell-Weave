import React from 'react';
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard';
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Monitor your news consumption and platform insights</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Articles Read</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-xs text-green-600 mt-2">+12% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reading Time</p>
                <p className="text-2xl font-bold text-gray-900">24.5h</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-xs text-green-600 mt-2">+8% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Topics Explored</p>
                <p className="text-2xl font-bold text-gray-900">47</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-xs text-blue-600 mt-2">5 new this month</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credibility Score</p>
                <p className="text-2xl font-bold text-gray-900">8.7/10</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-xs text-green-600 mt-2">High quality sources</p>
          </div>
        </div>

        {/* Main Dashboard */}
        <AnalyticsDashboard />
      </div>
    </div>
  );
}
