import { createClient } from '@supabase/supabase-js';
import ResponseAnalytics from '@/components/ResponseAnalytics';

export const dynamic = 'force-dynamic';

export default async function PublicResultsPage() {
  // Create Supabase client at runtime to avoid build-time errors
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all responses
  const { data: responses, error } = await supabase
    .from('survey_responses')
    .select(`
      id,
      participant_type,
      responses,
      completed_at,
      contact_id,
      contacts (
        name,
        email
      )
    `)
    .order('completed_at', { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-red-600">
          Error loading results: {error.message}
        </div>
      </div>
    );
  }

  const formattedResponses = (responses || []).map(r => ({
    id: r.id,
    email: r.contacts?.email || 'Anonymous',
    participant_type: r.participant_type,
    responded_at: r.completed_at,
    responses: r.responses,
    contacts: r.contacts ? { name: r.contacts.name } : null
  }));

  const delegateCount = formattedResponses.filter(r => r.participant_type === 'delegate').length;
  const exhibitorCount = formattedResponses.filter(r => r.participant_type === 'exhibitor').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            2026 Conference Survey Results
          </h1>
          <p className="text-lg text-gray-600">
            Total Responses: {formattedResponses.length}
            ({delegateCount} delegates, {exhibitorCount} exhibitors)
          </p>
        </div>

        {/* Delegate Results */}
        {delegateCount > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Delegate Feedback</h2>
            <ResponseAnalytics
              responses={formattedResponses.filter(r => r.participant_type === 'delegate')}
              filter="delegate"
            />
          </div>
        )}

        {/* Exhibitor Results */}
        {exhibitorCount > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Exhibitor Feedback</h2>
            <ResponseAnalytics
              responses={formattedResponses.filter(r => r.participant_type === 'exhibitor')}
              filter="exhibitor"
            />
          </div>
        )}

        {formattedResponses.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            No survey responses yet.
          </div>
        )}
      </div>
    </div>
  );
}
