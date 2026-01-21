import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { conference2026Survey } from '../lib/survey-config';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSurvey() {
  const { data, error } = await supabase
    .from('surveys')
    .insert({
      title: '2026 Conference Feedback Survey',
      slug: '2026-conference-feedback',
      description: 'Help us improve! Share your experience from the 2026 conference.',
      status: 'active',
      question_config: conference2026Survey,
      target_tags: ['26 Conference Delegate', '26 Conference Exhibitor'],
      valid_from: '2026-01-20T00:00:00Z',
      valid_until: '2026-12-31T23:59:59Z'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating survey:', error);
    process.exit(1);
  }

  console.log('Survey created successfully!');
  console.log('ID:', data.id);
  console.log('Slug:', data.slug);
  console.log('Status:', data.status);
}

createSurvey();
