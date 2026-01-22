import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRecentInvitations() {
  // Get invitations from the last 24 hours
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { data: invitations, error } = await supabase
    .from('survey_invitations')
    .select(`
      id,
      email,
      participant_type,
      token,
      sent_at,
      created_at,
      contacts (
        name
      )
    `)
    .gte('sent_at', twentyFourHoursAgo.toISOString())
    .order('sent_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching invitations:', error);
    return;
  }

  if (!invitations || invitations.length === 0) {
    console.log('❌ No invitations sent in the last 24 hours');
    console.log('\nChecking all invitations...\n');

    const { data: allInvitations } = await supabase
      .from('survey_invitations')
      .select('id, email, sent_at')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(10);

    if (allInvitations && allInvitations.length > 0) {
      console.log('Most recent invitations:');
      allInvitations.forEach(inv => {
        console.log(`  - ${inv.email}: sent ${new Date(inv.sent_at).toLocaleString()}`);
      });
    } else {
      console.log('No invitations have ever been sent.');
    }
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log(`\n📋 Found ${invitations.length} invitation(s) sent in the last 24 hours:\n`);

  for (const inv of invitations) {
    const contact: any = Array.isArray(inv.contacts) ? inv.contacts[0] : inv.contacts;
    const name = contact?.name || inv.email;

    console.log(`📧 ${name} (${inv.participant_type})`);
    console.log(`   Email: ${inv.email}`);
    console.log(`   Token: ${inv.token}`);
    console.log(`   URL: ${appUrl}/s/${inv.token}`);
    console.log(`   Sent: ${new Date(inv.sent_at).toLocaleString()}`);
    console.log('');
  }
}

checkRecentInvitations().catch(console.error);
