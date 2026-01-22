import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load from .env.local
config({ path: '.env.local' });

const token = 'da4cc550e49de17087176a04032ff2f1ef5e2a50632e42e6aa0b014842b40355';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkToken() {
  console.log('Checking token:', token);
  console.log('');

  // Check if invitation exists
  const { data: invitation, error } = await supabase
    .from('survey_invitations')
    .select(`
      id,
      survey_id,
      email,
      participant_type,
      token,
      responded_at,
      sent_at,
      surveys (
        id,
        title,
        status
      )
    `)
    .eq('token', token)
    .single();

  if (error) {
    console.error('❌ Error fetching invitation:', error);
    return;
  }

  if (!invitation) {
    console.log('❌ No invitation found with this token');
    return;
  }

  console.log('✅ Invitation found:');
  console.log('  ID:', invitation.id);
  console.log('  Email:', invitation.email);
  console.log('  Type:', invitation.participant_type);
  console.log('  Responded:', invitation.responded_at ? 'Yes' : 'No');
  console.log('  Sent:', invitation.sent_at);
  console.log('');

  const survey: any = Array.isArray(invitation.surveys)
    ? invitation.surveys[0]
    : invitation.surveys;

  if (survey) {
    console.log('Survey:', survey.title);
    console.log('Status:', survey.status);
  } else {
    console.log('❌ No survey associated with this invitation');
  }
}

checkToken().catch(console.error);
