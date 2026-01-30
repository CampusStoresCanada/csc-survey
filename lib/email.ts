// Email sending utility using Resend

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html, from }: SendEmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const senderEmail = from || process.env.RESEND_SENDER_EMAIL || 'CSC Conference Survey <noreply@campusstores.ca>';

  // TEST MODE: Override recipient email for testing
  const testEmailOverride = process.env.TEST_EMAIL_OVERRIDE;
  const originalTo = to;
  if (testEmailOverride) {
    to = testEmailOverride;
    console.log(`🧪 TEST MODE: Overriding recipient ${originalTo} → ${to}`);
  }

  if (!apiKey) {
    console.error('❌ Missing RESEND_API_KEY environment variable');
    return {
      success: false,
      error: 'Resend API key not configured'
    };
  }

  if (!to) {
    console.error('❌ Missing recipient email address');
    return {
      success: false,
      error: 'Recipient email address required'
    };
  }

  try {
    console.log(`📧 Sending email via Resend to: ${to}`);
    if (testEmailOverride && originalTo !== to) {
      console.log(`📧 Original recipient: ${originalTo}`);
    }
    console.log(`📧 Subject: ${subject}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [to],
        subject: subject,
        html: html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Resend API error:', data);
      return {
        success: false,
        error: data.message || 'Failed to send email'
      };
    }

    console.log('✅ Email sent successfully via Resend');
    console.log('📧 Message ID:', data.id);

    return {
      success: true,
      messageId: data.id
    };

  } catch (error) {
    console.error('❌ Failed to send email via Resend:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate survey invitation email HTML
 */
export function generateSurveyInvitationEmail(
  name: string,
  surveyUrl: string,
  participantType: 'delegate' | 'exhibitor',
  customMessage?: string
): string {
  const greeting = `Hi ${name}`;
  const participantTypeText = participantType === 'delegate' ? 'conference delegate' : 'exhibitor';

  // Default message if none provided
  const defaultMessage = `Thank you for attending the CSC Conference as a ${participantTypeText}. We'd love to hear about your experience!

Your feedback helps us improve future conferences and better serve our community. The survey takes just a few minutes to complete.`;

  const message = customMessage || defaultMessage;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSC Conference Survey</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 20px 0; font-size: 28px;">CSC Conference Survey</h1>

    <p style="font-size: 16px; margin-bottom: 20px;">${greeting},</p>

    <div style="font-size: 16px; margin-bottom: 30px; white-space: pre-wrap;">
${message}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${surveyUrl}"
         style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
        Take the Survey
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${surveyUrl}" style="color: #2563eb; word-break: break-all;">${surveyUrl}</a>
    </p>
  </div>

  <div style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
    <p>This is an automated email from Campus Stores Canada.</p>
    <p>If you have any questions, please contact us at google@campusstores.ca</p>
  </div>

</body>
</html>
  `.trim();
}
