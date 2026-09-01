const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Sends a one-time password (OTP) verification email.
 * @param {string} email - Destination email address
 * @param {string} otp - 6-digit OTP code
 */
const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: `"FindMyBus" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'FindMyBus - Email Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e293b; text-align: center; margin-bottom: 24px;">Verify Your Email Address</h2>
        <p style="color: #334155; font-size: 16px; line-height: 24px;">Welcome to FindMyBus! Please use the following verification code to complete your school registration. This code will expire in 10 minutes.</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <span style="display: inline-block; background-color: #f8fafc; border: 2px solid #e2e8f0; font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 12px 30px; border-radius: 6px; color: #f59e0b;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #64748b; font-size: 14px; line-height: 20px; text-align: center;">If you did not request this email, please ignore it or contact our support team.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">&copy; 2026 FindMyBus. All rights reserved.</p>
      </div>
    `,
  };

  try {
    console.log(`[OTP_CODE_LOG] Code ${otp} sent to ${email}`);
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error(`Error sending OTP email to ${email}: ${error.message}`);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

module.exports = {
  sendOtpEmail,
};
