import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SURVEY_SLUG = '2026-conference-feedback';
const DELEGATE_TAG = '26 Conference Delegate';
const EXHIBITOR_TAG = '26 Conference Exhibitor';

function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

function determineParticipantType(tagNames: string[]): 'delegate' | 'exhibitor' | null {
  // Prioritize delegate if they have both tags
  if (tagNames.includes(DELEGATE_TAG)) {
    return 'delegate';
  }
  if (tagNames.includes(EXHIBITOR_TAG)) {
    return 'exhibitor';
  }
  return null;
}

async function getSurvey() {
  const { data, error } = await supabase
    .from('surveys')
    .select('id, title')
    .eq('slug', SURVEY_SLUG)
    .single();

  if (error || !data) {
    throw new Error(`Survey not found: ${SURVEY_SLUG}`);
  }

  return data;
}

async function getContactsWithTags() {
  // Get contacts with their tag information from notion_properties
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('id, name, email, notion_properties')
    .not('email', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  // Filter contacts that have conference tags
  return contacts.filter(contact => {
    const tags = contact.notion_properties?.Tags || [];
    const tagNames = tags.map((tag: any) => tag.name || '');
    return tagNames.includes(DELEGATE_TAG) || tagNames.includes(EXHIBITOR_TAG);
  }).map(contact => {
    const tags = contact.notion_properties?.Tags || [];
    const tagNames = tags.map((tag: any) => tag.name || '');
    return {
      ...contact,
      tagNames,
      participantType: determineParticipantType(tagNames)
    };
  });
}

async function createInvitations(surveyId: string, contacts: any[]) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90); // 90 days from now

  const invitations = contacts.map(contact => ({
    survey_id: surveyId,
    contact_id: contact.id,
    token: generateToken(),
    email: contact.email,
    participant_type: contact.participantType,
    expires_at: expiresAt.toISOString()
  }));

  const { data, error } = await supabase
    .from('survey_invitations')
    .insert(invitations)
    .select();

  if (error) {
    throw new Error(`Failed to create invitations: ${error.message}`);
  }

  return data;
}

async function generateInvitations() {
  console.log('🔍 Finding survey...');
  const survey = await getSurvey();
  console.log(`✅ Found survey: ${survey.title} (${survey.id})`);

  console.log('\n🔍 Finding contacts with conference tags...');
  const contacts = await getContactsWithTags();
  console.log(`✅ Found ${contacts.length} contacts`);

  const delegateCount = contacts.filter(c => c.participantType === 'delegate').length;
  const exhibitorCount = contacts.filter(c => c.participantType === 'exhibitor').length;
  console.log(`   - ${delegateCount} delegates`);
  console.log(`   - ${exhibitorCount} exhibitors`);

  if (contacts.length === 0) {
    console.log('\n⚠️  No contacts found with conference tags. Exiting.');
    return;
  }

  console.log('\n📧 Creating magic link invitations...');
  const invitations = await createInvitations(survey.id, contacts);
  console.log(`✅ Created ${invitations.length} invitations`);

  console.log('\n📋 Sample magic links:');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  invitations.slice(0, 3).forEach((inv: any) => {
    console.log(`   ${appUrl}/s/${inv.token}`);
  });

  console.log('\n✨ Done! Invitations are ready to be sent.');
  console.log('\nNext steps:');
  console.log('1. Export invitations with: npm run export-invitations');
  console.log('2. Use the CSV to send emails with magic links');
}

generateInvitations().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
