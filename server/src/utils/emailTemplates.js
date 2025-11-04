export const otpEmailTemplate = (otp) => {
  return {
    subject: "Password Reset OTP - GreenArc LMS",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2563eb;">Password Reset OTP</h1>
        <p>You have requested to reset your password. Here is your verification code:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <span style="font-size: 32px; letter-spacing: 4px; font-weight: bold; color: #1f2937;">${otp}</span>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p style="color: #64748b;">If you didn't request this password reset, please ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #64748b; font-size: 12px;">This is an automated message from GreenArc LMS. Please do not reply.</p>
      </div>
    `,
    text: `Your OTP for password reset is: ${otp}. This code will expire in 5 minutes.`
  };
};