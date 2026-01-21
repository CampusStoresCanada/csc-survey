'use client';

import { useState } from 'react';
import { sendSurveyInvitations } from '@/app/dashboard/actions';

interface Invitation {
  id: string;
  email: string;
  name: string;
  participant_type: string;
  responded_at: string | null;
  opened_at: string | null;
  hasResponded: boolean;
}

interface DistributionListProps {
  invitations: Invitation[];
}

export default function DistributionList({ invitations }: DistributionListProps) {
  console.log('DistributionList received invitations:', invitations);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'delegate' | 'exhibitor'>('all');
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: number; failed: number; errors: Array<{ email: string; error: string }> } | null>(null);
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Share Your CSC Conference Experience');
  const [emailMessage, setEmailMessage] = useState(
    `Thank you for attending the CSC Conference. We'd love to hear about your experience!

Your feedback helps us improve future conferences and better serve our community. The survey takes just a few minutes to complete.`
  );

  // Filter invitations based on participant type
  const filteredInvitations = invitations.filter(inv => {
    if (filter === 'all') return true;
    return inv.participant_type === filter;
  });

  // Separate into responded and not responded
  const notResponded = filteredInvitations.filter(inv => !inv.hasResponded);
  const responded = filteredInvitations.filter(inv => inv.hasResponded);

  const handleToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    // Only select people who haven't responded
    const allNotRespondedIds = new Set(notResponded.map(inv => inv.id));
    setSelectedIds(allNotRespondedIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const selectedCount = selectedIds.size;

  const handleOpenEmailEditor = () => {
    if (selectedCount === 0) return;
    setShowEmailEditor(true);
  };

  const handleSendEmails = async () => {
    setShowEmailEditor(false);
    setIsSending(true);
    setSendResult(null);

    try {
      const contactIds = Array.from(selectedIds);
      const result = await sendSurveyInvitations(contactIds, emailSubject, emailMessage);

      setSendResult(result);

      // Clear selections if all succeeded
      if (result.failed === 0) {
        setSelectedIds(new Set());
      }

    } catch (error) {
      console.error('Error sending invitations:', error);
      alert('Failed to send invitations. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Recipients ({selectedCount} selected)
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Select All Pending
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({filteredInvitations.length})
          </button>
          <button
            onClick={() => setFilter('delegate')}
            className={`px-4 py-2 rounded ${
              filter === 'delegate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Delegates ({invitations.filter(i => i.participant_type === 'delegate').length})
          </button>
          <button
            onClick={() => setFilter('exhibitor')}
            className={`px-4 py-2 rounded ${
              filter === 'exhibitor'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Exhibitors ({invitations.filter(i => i.participant_type === 'exhibitor').length})
          </button>
        </div>
      </div>

      {/* Pending Responses Section */}
      {notResponded.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-md font-semibold text-gray-900">
              Pending Responses ({notResponded.length})
            </h4>
            <p className="text-sm text-gray-600">People who haven't responded yet</p>
          </div>
          <div className="divide-y divide-gray-200">
            {notResponded.map(inv => (
              <label
                key={inv.id}
                className="flex items-center px-6 py-4 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(inv.id)}
                  onChange={() => handleToggle(inv.id)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.name}</p>
                      <p className="text-sm text-gray-600">{inv.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        inv.participant_type === 'delegate'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {inv.participant_type}
                      </span>
                      {inv.opened_at && (
                        <span className="text-xs text-gray-500">
                          Opened {new Date(inv.opened_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Already Responded Section */}
      {responded.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-md font-semibold text-gray-900">
              Already Responded ({responded.length})
            </h4>
            <p className="text-sm text-gray-600">These people won't receive another survey email</p>
          </div>
          <div className="divide-y divide-gray-200">
            {responded.map(inv => (
              <div
                key={inv.id}
                className="flex items-center px-6 py-4 bg-gray-50 opacity-60"
              >
                <input
                  type="checkbox"
                  disabled
                  className="h-4 w-4 text-gray-400 rounded border-gray-300 cursor-not-allowed"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{inv.name}</p>
                      <p className="text-sm text-gray-500">{inv.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        inv.participant_type === 'delegate'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {inv.participant_type}
                      </span>
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Responded {new Date(inv.responded_at!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Result Message */}
      {sendResult && (
        <div className={`rounded-lg p-4 ${
          sendResult.failed === 0
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="mb-2">
            <p className={`text-sm font-medium ${
              sendResult.failed === 0 ? 'text-green-900' : 'text-yellow-900'
            }`}>
              {sendResult.failed === 0
                ? `✅ Successfully sent ${sendResult.success} ${sendResult.success === 1 ? 'email' : 'emails'}!`
                : `⚠️ Sent ${sendResult.success} emails, ${sendResult.failed} failed`
              }
            </p>
          </div>
          {sendResult.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-yellow-700 hover:text-yellow-900">
                View errors ({sendResult.errors.length})
              </summary>
              <div className="mt-2 space-y-1">
                {sendResult.errors.map((err, idx) => (
                  <p key={idx} className="text-xs text-yellow-800">
                    • {err.email}: {err.error}
                  </p>
                ))}
              </div>
            </details>
          )}
          <button
            onClick={() => setSendResult(null)}
            className="mt-3 text-xs text-gray-600 hover:text-gray-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Send Email Button */}
      {selectedCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Ready to send to {selectedCount} {selectedCount === 1 ? 'person' : 'people'}
              </p>
              <p className="text-xs text-blue-700">
                This will send survey emails to all selected recipients
              </p>
            </div>
            <button
              onClick={handleOpenEmailEditor}
              disabled={isSending}
              className={`px-6 py-3 font-medium rounded ${
                isSending
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSending ? 'Sending...' : 'Review & Send'}
            </button>
          </div>
        </div>
      )}

      {/* Email Editor Modal */}
      {showEmailEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Review Email</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Sending to {selectedCount} {selectedCount === 1 ? 'person' : 'people'}
                  </p>
                </div>
                <button
                  onClick={() => setShowEmailEditor(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Email Subject */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email subject line"
                />
              </div>

              {/* Email Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Message
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
                  placeholder="Your message to recipients"
                />
                <p className="text-xs text-gray-500 mt-2">
                  The survey link button will be automatically added below your message.
                </p>
              </div>

              {/* Preview */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Preview
                </label>
                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="bg-white rounded-lg shadow-sm p-8 max-w-xl mx-auto">
                    <h1 className="text-blue-600 text-2xl font-bold mb-4">CSC Conference Survey</h1>
                    <p className="text-gray-900 mb-4">Hi [Name],</p>
                    <div className="whitespace-pre-wrap text-gray-900 mb-6">
                      {emailMessage}
                    </div>
                    <div className="text-center my-6">
                      <div className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold">
                        Take the Survey
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-6">
                      If the button doesn't work, copy and paste this link into your browser:<br />
                      <span className="text-blue-600">[Survey URL will be included here]</span>
                    </p>
                    <div className="text-xs text-gray-400 text-center mt-8 pt-6 border-t">
                      <p>This is an automated email from the Canadian Scholastic Company.</p>
                      <p>If you have any questions, please contact us at info@campusstores.ca</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowEmailEditor(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendEmails}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Send to {selectedCount} {selectedCount === 1 ? 'Person' : 'People'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
