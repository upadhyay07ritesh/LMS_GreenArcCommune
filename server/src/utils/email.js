import nodemailer from 'nodemailer';

console.log('SMTP config check:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS ? 'SET' : 'MISSING'
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // ✅ Must be false for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // optional, helps with self-signed certs
  },
});

// Verify SMTP connection on startup
transporter.verify()
  .then(() => console.log('✅ SMTP connection verified'))
  .catch(error => console.error('❌ SMTP connection error:', error));

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP configuration is missing');
  }

  const from = process.env.SMTP_FROM || `no-reply@${(process.env.APP_NAME || 'app').toLowerCase()}.local`;

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High'
      }
    });
    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}
