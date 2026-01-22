import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import SurveyForm from '@/components/SurveyForm';
import { conference2026Survey } from '@/lib/survey-config';
import { submitSurvey, saveProgress } from './actions';

// Force dynamic rendering since we need to fetch data based on URL params
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SurveyPage({ params }: PageProps) {
  const { token } = await params;

  // Create Supabase client inside the component to avoid build-time instantiation
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: invitation } = await supabase
    .from('survey_invitations')
    .select(`
      id,
      survey_id,
      email,
      participant_type,
      expires_at,
      responded_at,
      opened_at,
      current_page,
      partial_responses,
      contacts (
        name
      ),
      surveys (
        id,
        title,
        description,
        status
      )
    `)
    .eq('token', token)
    .single();

  if (!invitation) {
    notFound();
  }

  const survey: any = Array.isArray(invitation.surveys)
    ? invitation.surveys[0]
    : invitation.surveys;

  if (!survey || survey.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Survey Unavailable</h1>
          <p className="text-gray-600">This survey is no longer available.</p>
        </div>
      </div>
    );
  }

  // Check if invitation has expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Survey Link Expired</h1>
          <p className="text-gray-600">This survey invitation has expired. Please contact us if you still need to complete the survey.</p>
        </div>
      </div>
    );
  }

  if (invitation.responded_at) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Already Submitted</h1>
          <p className="text-gray-600">You've already completed this survey. Thank you!</p>
        </div>
      </div>
    );
  }

  const participantType = invitation.participant_type as 'delegate' | 'exhibitor';
  const pages = conference2026Survey[participantType];

  // Get contact name for personalization
  const contact: any = Array.isArray(invitation.contacts) ? invitation.contacts[0] : invitation.contacts;
  const userName = contact?.name || invitation.email.split('@')[0];

  // Get saved progress
  const initialPage = invitation.current_page || 0;
  const initialResponses = invitation.partial_responses || {};

  const handleSubmit = submitSurvey.bind(
    null,
    invitation.id,
    invitation.survey_id,
    invitation.participant_type
  );

  const handlePageSave = saveProgress.bind(null, invitation.id);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <SurveyForm
        surveyId={survey.id}
        pages={pages}
        participantType={participantType}
        userName={userName}
        initialPage={initialPage}
        initialResponses={initialResponses}
        onPageSave={handlePageSave}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
