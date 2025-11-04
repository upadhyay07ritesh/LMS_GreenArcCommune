import express from 'express';
import { sendEmail } from '../utils/email.js'; // adjust path if needed

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const info = await sendEmail({
      to: 'upadhyay07ritesh@example.com', // 📨 put your real email here
      subject: 'Test Email from GreenArc LMS',
      html: `<h2>GreenArc LMS Test Email</h2><p>Your SMTP setup works perfectly 🎉</p>`,
    });
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Test email failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
