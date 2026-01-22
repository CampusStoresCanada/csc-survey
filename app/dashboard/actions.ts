'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getServiceRoleClient } from '@/lib/supabase';
import { sendEmail, generateSurveyInvitationEmail } from '@/lib/email';
import { randomBytes } from 'crypto';

export async function fetchDashboardData(filter: 'all' | 'delegate' | 'exhibitor') {
  const cookieStore = await cookies();

  // First verify the user is authenticated using the anon key with cookies
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Use service role for data fetching since we've verified authentication
  const supabase = getServiceRoleClient();

  // Fetch invitations
  let invitationsQuery = supabase
    .from('survey_invitations')
    .select('id, email, participant_type, responded_at, contact_id, survey_id')
    .not('responded_at', 'is', null)
    .order('responded_at', { ascending: false });

  if (filter !== 'all') {
    invitationsQuery = invitationsQuery.eq('participant_type', filter);
  }

  const { data: invitations, error: invError } = await invitationsQuery;

  if (invError) {
    throw new Error('Failed to fetch invitations: ' + invError.message);
  }

  if (!invitations || invitations.length === 0) {
    return [];
  }

  // Get all contact IDs and survey IDs
  const contactIds = invitations
    .map((inv) => inv.contact_id)
    .filter((id) => id !== null);
  const surveyIds = [...new Set(invitations.map((inv) => inv.survey_id))];

  // Fetch contacts in batch
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, name')
    .in('id', contactIds);

  // Fetch survey responses in batch
  const { data: surveyResponses } = await supabase
    .from('survey_responses')
    .select('id, contact_id, survey_id, responses, completed_at')
    .in('survey_id', surveyIds);

  // Create lookup maps
  const contactMap = new Map(contacts?.map((c) => [c.id, c]) || []);
  const responseMap = new Map(
    surveyResponses?.map((r) => [
      `${r.survey_id}-${r.contact_id}`,
      r,
    ]) || []
  );

  // Combine data
  const flattenedData = invitations.map((inv) => {
    const contact = inv.contact_id ? contactMap.get(inv.contact_id) : null;
    const response = responseMap.get(`${inv.survey_id}-${inv.contact_id}`);

    return {
      id: response?.id || inv.id,
      email: inv.email || 'N/A',
      participant_type: inv.participant_type,
      responded_at: inv.responded_at,
      responses: response?.responses || {},
      contacts: contact || null,
    };
  });

  return flattenedData;
}

export async function deleteResponse(responseId: string) {
  const cookieStore = await cookies();

  // Verify the user is authenticated
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Use service role to delete the response
  const supabase = getServiceRoleClient();

  // First get the response info before deleting
  const { data: response } = await supabase
    .from('survey_responses')
    .select('contact_id, survey_id')
    .eq('id', responseId)
    .single();

  // Delete from survey_responses table
  const { error: responseError } = await supabase
    .from('survey_responses')
    .delete()
    .eq('id', responseId);

  if (responseError) {
    throw new Error('Failed to delete response: ' + responseError.message);
  }

  // Also clear the responded_at timestamp in survey_invitations
  if (response) {
    await supabase
      .from('survey_invitations')
      .update({ responded_at: null, partial_responses: null })
      .eq('contact_id', response.contact_id)
      .eq('survey_id', response.survey_id);
  }

  return { success: true };
}

export async function fetchInvitations() {
  const cookieStore = await cookies();

  // Verify the user is authenticated
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Use service role for data fetching
  const supabase = getServiceRoleClient();

  // Fetch all contacts with email
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, name, email, notion_properties')
    .not('email', 'is', null);

  if (contactsError) {
    throw new Error('Failed to fetch contacts: ' + contactsError.message);
  }

  // Filter contacts that have conference tags
  // Tags are stored in notion_properties->'Tags'->'formula'->>'string' as comma-separated strings
  // Note: Tags in Notion have @ symbols (e.g., "@26 Conference Delegate")
  const filteredContacts = contacts.filter(contact => {
    const tagsString = contact.notion_properties?.Tags?.formula?.string || '';
    const hasConferenceTags = tagsString.includes('@26 Conference Delegate') ||
           tagsString.includes('@26 Conference Exhibitor');
    return hasConferenceTags;
  });

  console.log(`Total contacts with email: ${contacts.length}`);
  console.log(`Filtered contacts with conference tags: ${filteredContacts.length}`);

  // Log sample tags to verify what we're getting
  const sampleTags = filteredContacts.slice(0, 5).map(c => ({
    name: c.name,
    tags: c.notion_properties?.Tags?.formula?.string
  }));
  console.log('Sample tags from filtered contacts:', JSON.stringify(sampleTags, null, 2));

  // Fetch existing invitations to check response status
  const { data: existingInvitations } = await supabase
    .from('survey_invitations')
    .select('contact_id, responded_at, opened_at');

  const invitationsMap = new Map(
    existingInvitations?.map(inv => [
      inv.contact_id,
      { responded_at: inv.responded_at, opened_at: inv.opened_at }
    ]) || []
  );

  // Format the data
  const result = filteredContacts.map(contact => {
    const tagsString = contact.notion_properties?.Tags?.formula?.string || '';

    // Determine participant type from tags (tags have @ symbols)
    const isDelegate = tagsString.includes('@26 Conference Delegate');
    const participant_type = isDelegate ? 'delegate' : 'exhibitor';

    const invitation = invitationsMap.get(contact.id);

    return {
      id: contact.id,
      email: contact.email,
      name: contact.name || contact.email?.split('@')[0] || 'Unknown',
      participant_type,
      responded_at: invitation?.responded_at || null,
      opened_at: invitation?.opened_at || null,
      hasResponded: !!invitation?.responded_at,
      tags: tagsString, // Add tags for debugging
    };
  });

  const delegateCount = result.filter(r => r.participant_type === 'delegate').length;
  const exhibitorCount = result.filter(r => r.participant_type === 'exhibitor').length;
  const respondedCount = result.filter(r => r.hasResponded).length;

  console.log(`Delegates: ${delegateCount}, Exhibitors: ${exhibitorCount}`);
  console.log(`Already responded: ${respondedCount}, Pending: ${result.length - respondedCount}`);

  return result;
}

interface SendInvitationsResult {
  success: number;
  failed: number;
  errors: Array<{ contactId: string; email: string; error: string }>;
}

export async function sendSurveyInvitations(
  contactIds: string[],
  customSubject?: string,
  customMessage?: string
): Promise<SendInvitationsResult> {
  const cookieStore = await cookies();

  // Verify the user is authenticated
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const supabase = getServiceRoleClient();

  // Get the active survey
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .select('id')
    .eq('status', 'active')
    .single();

  if (surveyError || !survey) {
    throw new Error('No active survey found');
  }

  const surveyId = survey.id;

  // Fetch contact details
  const { data: contacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, name, email, notion_properties')
    .in('id', contactIds);

  if (contactsError) {
    throw new Error('Failed to fetch contacts: ' + contactsError.message);
  }

  if (!contacts || contacts.length === 0) {
    throw new Error('No contacts found');
  }

  const result: SendInvitationsResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  // Process each contact
  for (const contact of contacts) {
    try {
      // Determine participant type from tags
      const tagsString = contact.notion_properties?.Tags?.formula?.string || '';
      const isDelegate = tagsString.includes('@26 Conference Delegate');
      const participantType = isDelegate ? 'delegate' : 'exhibitor';

      // Generate a unique token for this invitation
      const token = randomBytes(32).toString('hex');

      // Set expiry date (90 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 90);

      // Create or update invitation record
      const { data: existingInvitation } = await supabase
        .from('survey_invitations')
        .select('id')
        .eq('contact_id', contact.id)
        .eq('survey_id', surveyId)
        .single();

      if (existingInvitation) {
        // Update existing invitation with new token
        const { error: updateError } = await supabase
          .from('survey_invitations')
          .update({
            token,
            participant_type: participantType,
            expires_at: expiresAt.toISOString(),
            sent_at: new Date().toISOString()
          })
          .eq('id', existingInvitation.id);

        if (updateError) {
          throw new Error(`Failed to update invitation: ${updateError.message}`);
        }
      } else {
        // Create new invitation
        const { error: insertError } = await supabase
          .from('survey_invitations')
          .insert({
            survey_id: surveyId,
            contact_id: contact.id,
            email: contact.email,
            participant_type: participantType,
            token,
            expires_at: expiresAt.toISOString(),
            sent_at: new Date().toISOString()
          });

        if (insertError) {
          throw new Error(`Failed to create invitation: ${insertError.message}`);
        }
      }

      // Generate survey URL with token
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const surveyUrl = `${baseUrl}/s/${token}`;

      // Generate email HTML with custom message if provided
      const emailHtml = generateSurveyInvitationEmail(
        contact.name || contact.email.split('@')[0],
        surveyUrl,
        participantType as 'delegate' | 'exhibitor',
        customMessage
      );

      // Send email with custom subject if provided
      const emailResult = await sendEmail({
        to: contact.email,
        subject: customSubject || 'Share Your CSC Conference Experience',
        html: emailHtml
      });

      if (emailResult.success) {
        result.success++;
        console.log(`✅ Sent survey to ${contact.name} (${contact.email})`);
      } else {
        result.failed++;
        result.errors.push({
          contactId: contact.id,
          email: contact.email,
          error: emailResult.error || 'Unknown error'
        });
        console.error(`❌ Failed to send to ${contact.email}: ${emailResult.error}`);
      }

    } catch (error) {
      result.failed++;
      result.errors.push({
        contactId: contact.id,
        email: contact.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error(`❌ Error processing ${contact.email}:`, error);
    }
  }

  return result;
}
