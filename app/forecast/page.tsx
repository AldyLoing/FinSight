'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/db';
import { Navigation } from '@/components/Navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LineChartComponent, AreaChartComponent } from '@/components/charts/Charts';
import { Select } from '@/components/ui/Input';

interface Forecast {
  id: string;
  forecast_date: string;
  predicted_balance: number;
  confidence: number;
  scenario: string;
  data?: any;
  created_at: string;
}

export default function ForecastPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [scenario, setScenario] = useState('balanced');

  useEffect(() => {
    checkAuth();
    fetchForecasts();
  }, []);

  async function checkAuth() {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      window.location.href = '/auth/login';
    }
  }

  async function fetchForecasts() {
    try {
      const res = await fetch('/api/forecast');
      if (res.ok) {
        const data = await res.json();
        setForecasts(data.forecasts || []);
      }
    } catch (error) {
      console.error('Error fetching forecasts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateForecast() {
    try {
      setGenerating(true);
      const res = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          days: 90,
          scenario 
        }),
      });
      
      if (res.ok) {
        await fetchForecasts();
      }
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setGenerating(false);
    }
  }

  // Prepare chart data
  const chartData = forecasts.map((f) => ({
    name: new Date(f.forecast_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    date: new Date(f.forecast_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: f.predicted_balance ?? 0,
    balance: f.predicted_balance ?? 0,
    confidence: (f.confidence ?? 0) * 100,
  }));

  // Calculate statistics
  const avgBalance = forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + (f.predicted_balance ?? 0), 0) / forecasts.length
    : 0;

  const minBalance = forecasts.length > 0
    ? Math.min(...forecasts.map(f => f.predicted_balance ?? 0))
    : 0;

  const maxBalance = forecasts.length > 0
    ? Math.max(...forecasts.map(f => f.predicted_balance ?? 0))
    : 0;

  const avgConfidence = forecasts.length > 0
    ? forecasts.reduce((sum, f) => sum + (f.confidence ?? 0), 0) / forecasts.length
    : 0;

  const scenarios = [
    { value: 'optimistic', label: '😊 Optimistic (Higher Income)' },
    { value: 'balanced', label: '⚖️ Balanced (Normal)' },
    { value: 'pessimistic', label: '😟 Pessimistic (Lower Income)' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading forecast...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cash Flow Forecast</h1>
              <p className="text-gray-600 mt-2">Predict your future financial position</p>
            </div>
            <Button 
              onClick={generateForecast} 
              variant="primary"
              isLoading={generating}
              disabled={generating}
            >
              📈 Generate Forecast
            </Button>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Scenario:</label>
            <Select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              options={scenarios}
            />
          </div>
        </div>

        {/* Summary Cards */}
        {forecasts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Balance (90d)</p>
                  <p className={`text-2xl font-bold ${avgBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${avgBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Min Balance</p>
                  <p className={`text-2xl font-bold ${minBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ${minBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-4xl">📉</div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Max Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${maxBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-4xl">📈</div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Confidence</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(avgConfidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="text-4xl">🎯</div>
              </div>
            </Card>
          </div>
        )}

        {/* Charts */}
        {forecasts.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg mb-2">No forecast data yet</p>
              <p className="text-sm mb-6">Generate a forecast to see your predicted cash flow for the next 90 days</p>
              <Button onClick={generateForecast} variant="primary" isLoading={generating}>
                📈 Generate 90-Day Forecast
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Balance Forecast Chart */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Predicted Balance (Next 90 Days)</CardTitle>
                  <Badge variant="info">{forecasts.length} data points</Badge>
                </div>
              </CardHeader>
              <LineChartComponent 
                data={chartData}
                dataKey="balance"
                title=""
                color="#3b82f6"
                height={350}
              />
            </Card>

            {/* Confidence Chart */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Forecast Confidence</CardTitle>
              </CardHeader>
              <AreaChartComponent 
                data={chartData}
                dataKey="confidence"
                title=""
                color="#10b981"
                height={300}
              />
            </Card>

            {/* Risk Analysis */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Risk Analysis</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                {minBalance < 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <h4 className="font-semibold text-red-800 mb-1">Negative Balance Risk</h4>
                        <p className="text-sm text-red-700">
                          Your forecast predicts a minimum balance of ${minBalance.toFixed(2)}. 
                          Consider reducing expenses or increasing income to avoid overdraft.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {minBalance >= 0 && minBalance < 1000 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">⚡</span>
                      <div>
                        <h4 className="font-semibold text-yellow-800 mb-1">Low Balance Warning</h4>
                        <p className="text-sm text-yellow-700">
                          Your balance may drop to ${minBalance.toFixed(2)}. 
                          Consider building a larger emergency fund.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {minBalance >= 1000 && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">✅</span>
                      <div>
                        <h4 className="font-semibold text-green-800 mb-1">Healthy Cash Flow</h4>
                        <p className="text-sm text-green-700">
                          Your forecast looks good! Maintain your current spending habits.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {avgConfidence < 0.6 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">ℹ️</span>
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-1">Low Confidence</h4>
                        <p className="text-sm text-blue-700">
                          Forecast confidence is {(avgConfidence * 100).toFixed(0)}%. 
                          Add more transaction history for better predictions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Forecast Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Forecast</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Predicted Balance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scenario</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {forecasts.slice(0, 10).map((forecast) => (
                      <tr key={forecast.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(forecast.forecast_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${
                            (forecast.predicted_balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${(forecast.predicted_balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={
                            (forecast.confidence ?? 0) >= 0.8 ? 'success' :
                            (forecast.confidence ?? 0) >= 0.6 ? 'warning' :
                            'danger'
                          }>
                            {((forecast.confidence ?? 0) * 100).toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {forecast.scenario || 'realistic'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {forecasts.length > 10 && (
                <div className="p-4 text-center text-sm text-gray-600">
                  Showing 10 of {forecasts.length} forecasts
                </div>
              )}
            </Card>
          </>
        )}

        {/* Info Card */}
        <Card className="mt-8 bg-purple-50 border-purple-200">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">📊</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">About Forecasting</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  Our forecasting engine analyzes your historical transactions from the last 90 days to predict future cash flow.
                </p>
                <p>
                  <strong>Scenarios:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Optimistic:</strong> Assumes income increases and expenses decrease</li>
                  <li><strong>Balanced:</strong> Uses historical averages (recommended)</li>
                  <li><strong>Pessimistic:</strong> Assumes income decreases and expenses increase</li>
                </ul>
                <p className="text-xs text-gray-600 mt-3">
                  💡 Tip: More transaction history = More accurate forecasts
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
