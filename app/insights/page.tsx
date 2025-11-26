'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/db';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Insight {
  id: string;
  type: string;
  title: string;
  summary: string;
  data?: any;
  severity: string;
  acknowledged: boolean;
  created_at: string;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    checkAuth();
    fetchInsights();
  }, [filter]);

  async function checkAuth() {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/auth/login';
    }
  }

  async function fetchInsights() {
    try {
      const params = new URLSearchParams();
      if (filter === 'unread') params.append('acknowledged', 'false');
      if (filter === 'read') params.append('acknowledged', 'true');
      
      const res = await fetch(`/api/insights?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateInsights(useAI: boolean = false) {
    try {
      setGenerating(true);
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_ai: useAI }),
      });
      
      if (res.ok) {
        await fetchInsights();
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/insights/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledged: true }),
      });
      
      if (res.ok) {
        await fetchInsights();
      }
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  }

  async function deleteInsight(id: string) {
    try {
      const res = await fetch(`/api/insights/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        await fetchInsights();
      }
    } catch (error) {
      console.error('Error deleting insight:', error);
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return '⚠️';
      case 'trend': return '📊';
      case 'budget': return '🎯';
      case 'goal': return '🏆';
      case 'recommendation': return '💡';
      default: return '📌';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading insights...</p>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = insights.filter(i => !i.acknowledged).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Insights & Alerts</h1>
              <p className="text-gray-600 mt-2">Get intelligent insights about your finances</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                onClick={() => generateInsights(false)} 
                variant="outline"
                isLoading={generating}
                disabled={generating}
              >
                🔍 Analyze Data
              </Button>
              <Button 
                onClick={() => generateInsights(true)} 
                variant="primary"
                isLoading={generating}
                disabled={generating}
              >
                🤖 AI Analysis
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`pb-3 px-4 font-medium transition-colors ${
                filter === 'all'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Insights ({insights.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`pb-3 px-4 font-medium transition-colors ${
                filter === 'unread'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`pb-3 px-4 font-medium transition-colors ${
                filter === 'read'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Read ({insights.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Insights List */}
        {insights.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">💡</div>
              <p className="text-lg mb-2">No insights yet</p>
              <p className="text-sm mb-6">Generate insights to discover patterns and recommendations</p>
              <div className="flex justify-center space-x-3">
                <Button onClick={() => generateInsights(false)} variant="outline">
                  🔍 Quick Analysis
                </Button>
                <Button onClick={() => generateInsights(true)} variant="primary">
                  🤖 AI Powered Analysis
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} hover className={!insight.acknowledged ? 'border-l-4 border-l-blue-600' : ''}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{getTypeIcon(insight.type)}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getSeverityColor(insight.severity)}>
                          {insight.severity}
                        </Badge>
                        <Badge variant="default">{insight.type}</Badge>
                        {!insight.acknowledged && (
                          <Badge variant="info">New</Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(insight.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {insight.title}
                    </h3>

                    <p className="text-gray-700 mb-4">
                      {insight.summary}
                    </p>

                    {insight.data && Object.keys(insight.data).length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Details:</p>
                        <div className="space-y-1 text-sm text-gray-600">
                          {Object.entries(insight.data).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="font-semibold">
                                {typeof value === 'number' 
                                  ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      {!insight.acknowledged && (
                        <Button
                          onClick={() => markAsRead(insight.id)}
                          variant="primary"
                          size="sm"
                        >
                          Mark as Read
                        </Button>
                      )}
                      <Button
                        onClick={() => deleteInsight(insight.id)}
                        variant="outline"
                        size="sm"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">🤖</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About AI Insights</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>Quick Analysis:</strong> Uses local algorithms to detect anomalies, trends, and budget risks.
                </p>
                <p>
                  <strong>AI Powered Analysis:</strong> Uses Claude AI to provide personalized recommendations and deeper financial insights.
                </p>
                <p className="text-xs text-gray-600 mt-3">
                  💡 Tip: Run analysis regularly to stay on top of your financial health.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
