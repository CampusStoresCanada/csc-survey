'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { fetchDashboardData, deleteResponse, fetchInvitations } from '@/app/dashboard/actions';
import ResponseAnalytics from './ResponseAnalytics';
import DistributionList from './DistributionList';

interface Response {
  id: string;
  email: string;
  participant_type: string;
  responded_at: string;
  responses: Record<string, any>;
  contacts: { name: string } | null;
}

interface Invitation {
  id: string;
  email: string;
  name: string;
  participant_type: string;
  responded_at: string | null;
  opened_at: string | null;
  hasResponded: boolean;
}

interface DashboardContentProps {
  initialSession: Session | null;
}

export default function DashboardContent({ initialSession }: DashboardContentProps) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'delegate' | 'exhibitor'>('all');
  const [view, setView] = useState<'table' | 'analytics' | 'distribution'>('table');
  const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (initialSession) {
      fetchResponses();
      fetchInvitationsList();
    }
  }, [filter, initialSession]);

  const fetchResponses = async () => {
    setLoading(true);

    try {
      const data = await fetchDashboardData(filter);
      setResponses(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // If unauthorized, redirect to login
      if (error instanceof Error && error.message === 'Unauthorized') {
        router.push('/dashboard/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitationsList = async () => {
    try {
      const data = await fetchInvitations();
      console.log('Fetched invitations data:', data);
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      if (error instanceof Error && error.message === 'Unauthorized') {
        router.push('/dashboard/login');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/dashboard/login');
    router.refresh();
  };

  const handleExportCSV = () => {
    // CSV export logic
    const csvRows = ['Name,Email,Type,Submitted,Overall Rating'];

    responses.forEach(r => {
      const name = r.contacts?.name || r.email.split('@')[0];
      const overall = r.responses.overall_experience || 'N/A';
      const date = new Date(r.responded_at).toLocaleDateString();

      csvRows.push(`"${name}","${r.email}","${r.participant_type}","${date}","${overall}"`);
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `survey-responses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleDelete = async (responseId: string) => {
    if (!confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteResponse(responseId);
      // Refresh the responses list
      await fetchResponses();
    } catch (error) {
      console.error('Error deleting response:', error);
      alert('Failed to delete response. Please try again.');
    }
  };

  const handleViewDetails = (response: Response) => {
    setSelectedResponse(response);
    setView('analytics');
  };

  const handleBackToTable = () => {
    setSelectedResponse(null);
    setView('table');
  };

  const stats = {
    total: responses.length,
    delegates: responses.filter(r => r.participant_type === 'delegate').length,
    exhibitors: responses.filter(r => r.participant_type === 'exhibitor').length,
    avgRating: responses.length > 0
      ? (responses.reduce((sum, r) => sum + (r.responses.overall_experience || 0), 0) / responses.length).toFixed(1)
      : '0',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Survey Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Responses</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Delegates</p>
            <p className="text-3xl font-bold text-blue-600">{stats.delegates}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Exhibitors</p>
            <p className="text-3xl font-bold text-green-600">{stats.exhibitors}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Avg Rating</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.avgRating}/5</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => {
                  setView('table');
                  setSelectedResponse(null);
                }}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  view === 'table'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Response Table
              </button>
              <button
                onClick={() => {
                  setView('analytics');
                  setSelectedResponse(null);
                }}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  view === 'analytics'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics & Insights
              </button>
              <button
                onClick={() => {
                  setView('distribution');
                  setSelectedResponse(null);
                }}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  view === 'distribution'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Distribution
              </button>
            </nav>
          </div>
        </div>

        {/* Filters and Export */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('delegate')}
              className={`px-4 py-2 rounded ${
                filter === 'delegate'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Delegates
            </button>
            <button
              onClick={() => setFilter('exhibitor')}
              className={`px-4 py-2 rounded ${
                filter === 'exhibitor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Exhibitors
            </button>
          </div>
          {view === 'table' && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export CSV
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">Loading responses...</p>
          </div>
        ) : view === 'distribution' ? (
          <DistributionList invitations={invitations} />
        ) : responses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No responses yet</p>
          </div>
        ) : view === 'analytics' ? (
          <>
            {selectedResponse && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Viewing individual response for: {selectedResponse.contacts?.name || selectedResponse.email}
                  </p>
                  <p className="text-xs text-blue-700">
                    {selectedResponse.participant_type} • Submitted {new Date(selectedResponse.responded_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={handleBackToTable}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  Back to All Responses
                </button>
              </div>
            )}
            <ResponseAnalytics
              responses={selectedResponse ? [selectedResponse] : responses}
              filter={filter}
              isSingleView={!!selectedResponse}
            />
          </>
        ) : (
          /* Responses Table */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {(
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overall</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {responses.map((response) => (
                    <tr key={response.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {response.contacts?.name || response.email.split('@')[0]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {response.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          response.participant_type === 'delegate'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {response.participant_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {response.responses.overall_experience || 'N/A'}/5
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(response.responded_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(response)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleDelete(response.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
