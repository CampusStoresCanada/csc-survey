'use server';

import { redirect } from 'next/navigation';
import { getServiceRoleClient } from '@/lib/supabase';

export async function saveProgress(
  invitationId: string,
  currentPage: number,
  responses: Record<string, any>
): Promise<void> {
  const supabase = getServiceRoleClient();

  const { error } = await supabase
    .from('survey_invitations')
    .update({
      current_page: currentPage,
      partial_responses: responses
    })
    .eq('id', invitationId);

  if (error) {
    throw new Error('Failed to save progress');
  }
}

export async function submitSurvey(
  invitationId: string,
  surveyId: string,
  participantType: string,
  responses: Record<string, any>
) {
  const serviceSupabase = getServiceRoleClient();

  // Get the invitation to retrieve contact_id
  const { data: invitation } = await serviceSupabase
    .from('survey_invitations')
    .select('contact_id')
    .eq('id', invitationId)
    .single();

  const { error: responseError } = await serviceSupabase
    .from('survey_responses')
    .insert({
      survey_id: surveyId,
      contact_id: invitation?.contact_id || null,
      participant_type: participantType,
      responses: responses,
      completed_at: new Date().toISOString()
    });

  if (responseError) {
    throw new Error('Failed to save response');
  }

  await serviceSupabase
    .from('survey_invitations')
    .update({
      responded_at: new Date().toISOString(),
      current_page: null,
      partial_responses: null
    })
    .eq('id', invitationId);

  redirect('/s/thanks');
}
