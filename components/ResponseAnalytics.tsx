'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import WordCloud from './WordCloud';

interface Response {
  id: string;
  email: string;
  participant_type: string;
  responded_at: string;
  responses: Record<string, any>;
  contacts: { name: string } | null;
}

interface ResponseAnalyticsProps {
  responses: Response[];
  filter: 'all' | 'delegate' | 'exhibitor';
  isSingleView?: boolean;
}

export default function ResponseAnalytics({ responses, filter, isSingleView = false }: ResponseAnalyticsProps) {
  // Calculate analytics for numeric questions
  const numericAnalytics = useMemo(() => {
    const numericQuestions = [
      { id: 'overall_experience', label: 'Overall Experience', max: 5 },
      { id: 'venue_rating', label: 'Venue Rating', max: 5 },
      { id: 'food_rating', label: 'Food Rating', max: 5 },
      { id: 'schedule_rating', label: 'Schedule Rating', max: 5 },
    ];

    return numericQuestions.map(q => {
      const values = responses
        .map(r => r.responses[q.id])
        .filter(v => typeof v === 'number');

      const avg = values.length > 0
        ? (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2)
        : '0';

      // Calculate distribution
      const distribution = Array.from({ length: q.max }, (_, i) => {
        const rating = i + 1;
        const count = values.filter(v => v === rating).length;
        return { rating, count };
      });

      return {
        id: q.id,
        label: q.label,
        average: avg,
        count: values.length,
        distribution
      };
    });
  }, [responses]);

  // Calculate session ratings
  const sessionRatings = useMemo(() => {
    const allSessionRatings: Record<string, number[]> = {};

    responses.forEach(r => {
      const sessions = r.responses.sessions_rating;
      if (sessions && typeof sessions === 'object') {
        Object.entries(sessions).forEach(([session, rating]) => {
          if (typeof rating === 'number') {
            if (!allSessionRatings[session]) {
              allSessionRatings[session] = [];
            }
            allSessionRatings[session].push(rating);
          }
        });
      }
    });

    return Object.entries(allSessionRatings).map(([session, ratings]) => ({
      session,
      average: (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2),
      count: ratings.length
    })).sort((a, b) => parseFloat(b.average) - parseFloat(a.average));
  }, [responses]);

  // Extract text responses for word frequency
  const textAnalytics = useMemo(() => {
    const textQuestions = [
      { id: 'what_worked', label: 'What Worked Well' },
      { id: 'waste_of_time', label: 'What Felt Like a Waste' },
      { id: 'what_was_missing', label: 'What Was Missing' },
      { id: 'stop_doing', label: 'What to Stop Doing' },
      { id: 'one_thing_change', label: 'What to Do for 2027' },
      { id: 'honest_feedback', label: 'Honest Feedback' },
    ];

    return textQuestions.map(q => {
      const texts = responses
        .map(r => r.responses[q.id])
        .filter(t => typeof t === 'string' && t.trim().length > 0);

      // Simple word frequency (excluding common words)
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'it', 'its', 'i', 'we', 'they', 'them', 'their', 'my', 'your', 'our']);

      const wordFreq: Record<string, number> = {};
      texts.forEach(text => {
        const words = text.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length > 3 && !stopWords.has(w));

        words.forEach(word => {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
      });

      const topWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([word, count]) => ({ word, count }));

      return {
        id: q.id,
        label: q.label,
        responseCount: texts.length,
        topWords,
        allResponses: texts
      };
    });
  }, [responses]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Overall Metrics */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Rating Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {numericAnalytics.map((metric, idx) => (
            <div key={metric.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{metric.label}</h3>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{metric.average}</div>
                  <div className="text-sm text-gray-500">out of 5</div>
                  <div className="text-xs text-gray-400">{metric.count} responses</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={metric.distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill={COLORS[idx % COLORS.length]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      {/* Session Ratings */}
      {sessionRatings.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Ratings</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={sessionRatings} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis type="category" dataKey="session" width={200} />
                <Tooltip />
                <Bar dataKey="average" fill="#3b82f6">
                  {sessionRatings.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Text Response Analytics */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Open-Ended Response Themes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {textAnalytics.map(metric => (
            <div key={metric.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{metric.label}</h3>
              <p className="text-sm text-gray-500 mb-4">{metric.responseCount} responses</p>

              {metric.allResponses.length > 0 ? (
                <div>
                  {/* Show text for single view, word cloud for aggregate view */}
                  {isSingleView ? (
                    <div className="mt-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Response:</h4>
                      <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded p-3">
                        {metric.allResponses[0]}
                      </div>
                    </div>
                  ) : (
                    <>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Word Cloud:</h4>
                      <div className="mb-4">
                        <WordCloud words={metric.topWords} width={500} height={300} />
                      </div>

                      {/* Show sample responses */}
                      <details className="mt-4">
                        <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                          View all responses ({metric.allResponses.length})
                        </summary>
                        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                          {metric.allResponses.map((response, idx) => (
                            <div key={idx} className="text-sm text-gray-700 border-l-2 border-gray-300 pl-3 py-1">
                              {response}
                            </div>
                          ))}
                        </div>
                      </details>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No response provided</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
