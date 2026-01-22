import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkInvitationStatus() {
  const { data: invitations, error } = await supabase
    .from('survey_invitations')
    .select('id, email, token, sent_at, responded_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Total invitations: ${invitations.length}`);

  const withTokens = invitations.filter(inv => inv.token);
  const withoutTokens = invitations.filter(inv => !inv.token);
  const sent = invitations.filter(inv => inv.sent_at);
  const responded = invitations.filter(inv => inv.responded_at);

  console.log(`\nStatus breakdown:`);
  console.log(`  ✅ With tokens: ${withTokens.length}`);
  console.log(`  ❌ Without tokens: ${withoutTokens.length}`);
  console.log(`  📧 Sent (has sent_at): ${sent.length}`);
  console.log(`  ✔️  Responded: ${responded.length}`);

  if (withoutTokens.length > 0) {
    console.log(`\n⚠️  ${withoutTokens.length} invitations are missing tokens!`);
    console.log(`\nFirst 10 without tokens:`);
    withoutTokens.slice(0, 10).forEach(inv => {
      console.log(`  - ${inv.email} (ID: ${inv.id})`);
    });
  }

  if (withTokens.length > 0) {
    console.log(`\n✅ Sample invitation with token:`);
    const sample = withTokens[0];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log(`  ${sample.email}`);
    console.log(`  ${appUrl}/s/${sample.token}`);
  }
}

checkInvitationStatus().catch(console.error);
