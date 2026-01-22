import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listInvitations() {
  const { data: invitations, error } = await supabase
    .from('survey_invitations')
    .select(`
      id,
      email,
      participant_type,
      token,
      sent_at,
      responded_at,
      contacts (
        name
      )
    `)
    .order('sent_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching invitations:', error);
    return;
  }

  if (!invitations || invitations.length === 0) {
    console.log('No invitations found');
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log(`\n📋 Found ${invitations.length} invitation(s):\n`);

  for (const inv of invitations) {
    const contact: any = Array.isArray(inv.contacts) ? inv.contacts[0] : inv.contacts;
    const name = contact?.name || inv.email;
    const status = inv.responded_at ? '✅ Completed' : '⏳ Pending';

    console.log(`${status} ${name} (${inv.participant_type})`);
    console.log(`   Email: ${inv.email}`);
    console.log(`   URL: ${appUrl}/s/${inv.token}`);
    if (inv.sent_at) {
      console.log(`   Sent: ${new Date(inv.sent_at).toLocaleString()}`);
    }
    console.log('');
  }
}

listInvitations().catch(console.error);
