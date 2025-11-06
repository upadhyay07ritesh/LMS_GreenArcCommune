import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY in environment variables');
  }

  const from = process.env.RESEND_FROM || 'GreenArc LMS <no-reply@greenarccommune.com>';

  try {
    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });

    if (response.error) {
      console.error('❌ Resend API error:', response.error);
      throw new Error(response.error.message);
    }

    console.log('✅ Email sent via Resend:', response.data?.id || '(no ID returned)');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send email via Resend:', error);
    throw error;
  }
}
