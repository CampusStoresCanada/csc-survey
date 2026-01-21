import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SURVEY_SLUG = '2026-conference-feedback';

async function exportInvitations() {
  console.log('🔍 Finding survey...');
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .select('id, title')
    .eq('slug', SURVEY_SLUG)
    .single();

  if (surveyError || !survey) {
    throw new Error(`Survey not found: ${SURVEY_SLUG}`);
  }

  console.log(`✅ Found survey: ${survey.title}`);

  console.log('\n🔍 Fetching invitations...');
  const { data: invitations, error } = await supabase
    .from('survey_invitations')
    .select(`
      id,
      token,
      email,
      participant_type,
      sent_at,
      opened_at,
      responded_at,
      expires_at,
      contacts (
        name,
        organization_id,
        organizations (
          name
        )
      )
    `)
    .eq('survey_id', survey.id)
    .order('email');

  if (error) {
    throw new Error(`Failed to fetch invitations: ${error.message}`);
  }

  console.log(`✅ Found ${invitations.length} invitations`);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const csvRows = [
    'Email,Name,Organization,Participant Type,Magic Link,Sent,Opened,Responded'
  ];

  for (const inv of invitations) {
    const contact = Array.isArray(inv.contacts) ? inv.contacts[0] : inv.contacts;
    const org = contact?.organizations;
    const orgName = Array.isArray(org) ? org[0]?.name : (org as any)?.name;

    csvRows.push([
      inv.email,
      contact?.name || '',
      orgName || '',
      inv.participant_type,
      `${appUrl}/s/${inv.token}`,
      inv.sent_at ? 'Yes' : 'No',
      inv.opened_at ? 'Yes' : 'No',
      inv.responded_at ? 'Yes' : 'No'
    ].map(field => `"${field}"`).join(','));
  }

  const csv = csvRows.join('\n');
  const filename = `invitations-${SURVEY_SLUG}-${new Date().toISOString().split('T')[0]}.csv`;

  writeFileSync(filename, csv);

  console.log(`\n✅ Exported to: ${filename}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total invitations: ${invitations.length}`);
  console.log(`   Sent: ${invitations.filter(i => i.sent_at).length}`);
  console.log(`   Opened: ${invitations.filter(i => i.opened_at).length}`);
  console.log(`   Responded: ${invitations.filter(i => i.responded_at).length}`);
}

exportInvitations().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
