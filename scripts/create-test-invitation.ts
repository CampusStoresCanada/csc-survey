import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SURVEY_SLUG = '2026-conference-feedback';

async function createTestInvitation() {
  // Get survey
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .select('id, title')
    .eq('slug', SURVEY_SLUG)
    .single();

  if (surveyError || !survey) {
    throw new Error(`Survey not found: ${SURVEY_SLUG}`);
  }

  console.log(`✅ Found survey: ${survey.title}`);

  // Create test invitations for both delegate and exhibitor
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const testInvitations = [
    {
      survey_id: survey.id,
      contact_id: null,
      token: randomBytes(32).toString('base64url'),
      email: 'delegate.test@example.com',
      participant_type: 'delegate',
      expires_at: expiresAt.toISOString()
    },
    {
      survey_id: survey.id,
      contact_id: null,
      token: randomBytes(32).toString('base64url'),
      email: 'exhibitor.test@example.com',
      participant_type: 'exhibitor',
      expires_at: expiresAt.toISOString()
    }
  ];

  const { data: invitations, error } = await supabase
    .from('survey_invitations')
    .insert(testInvitations)
    .select();

  if (error) {
    throw new Error(`Failed to create test invitations: ${error.message}`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log('\n✅ Created test invitations:');
  console.log('\n📋 DELEGATE SURVEY:');
  console.log(`   ${appUrl}/s/${invitations[0].token}`);
  console.log('\n📋 EXHIBITOR SURVEY:');
  console.log(`   ${appUrl}/s/${invitations[1].token}`);
  console.log('\nOpen these URLs in your browser to test the survey!');
}

createTestInvitation().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
