import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSurveys() {
  const { data: surveys, error } = await supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${surveys.length} survey(s):\n`);

  surveys.forEach(survey => {
    console.log(`Survey: ${survey.title}`);
    console.log(`  ID: ${survey.id}`);
    console.log(`  Slug: ${survey.slug}`);
    console.log(`  Status: ${survey.status}`);
    console.log('');
  });
}

checkSurveys().catch(console.error);
