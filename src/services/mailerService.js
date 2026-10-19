/**
 * mailerService.js
 *
 * Uses Resend (https://resend.com) HTTP API instead of SMTP.
 * Render free tier blocks all outbound SMTP ports (25, 465, 587),
 * but Resend sends over HTTPS and works fine on any cloud host.
 *
 * Setup:
 *  1. Sign up at https://resend.com (free: 3,000 emails/month)
 *  2. Create an API key
 *  3. Set RESEND_API_KEY in your Render environment variables
 *  4. While testing without a custom domain, set:
 *       SMTP_FROM=Innotech E-Waste <onboarding@resend.dev>
 *     and you can only send to the email that owns the Resend account.
 *     Once you add a domain in Resend, you can send to anyone.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';


export const sendOtpEmail = async (email, otp, role = 'individual') => {
  const roleTitle =
    role === 'bulk_institution'
      ? 'Institutional Partner / Bulk Seller'
      : 'Individual Recycler';

  // --- Development / no-key fallback: print OTP to console ---
  if (!process.env.RESEND_API_KEY) {
    console.log('\n=================== [DEV EMAIL SENT] ===================');
    console.log(`To:   ${email}`);
    console.log(`Role: ${roleTitle}`);
    console.log(`OTP:  ${otp}`);
    console.log('========================================================\n');
    return { id: 'dev-mock-id-' + Date.now() };
  }

  // --- Production: send via Resend HTTP API (no SMTP, pure HTTPS) ---
  const from =
    process.env.SMTP_FROM ||
    'Innotech E-Waste <onboarding@resend.dev>';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #059669; margin: 0;">Innotech E-Waste Recycling</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Role: <strong>${roleTitle}</strong></p>
      </div>
      <p style="color: #334155; font-size: 16px;">Hello,</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.5;">Use the one-time verification code below to complete your login or registration:</p>
      <div style="background-color: #ecfdf5; border: 2px dashed #10b981; border-radius: 8px; text-align: center; padding: 16px; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #065f46;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px;">This OTP will expire in <strong>10 minutes</strong>. Never share this code with anyone.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">Making e-waste recycling profitable, transparent, and planet-positive.</p>
    </div>
  `;

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your Innotech E-Waste OTP Code',
      html,
      text: `Your OTP for logging in as ${roleTitle} is ${otp}. This code is valid for 10 minutes.`
    })
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[Resend API Error]:', data);
    throw new Error(data?.message || 'Failed to send OTP email via Resend.');
  }

  console.log(`[Mailer]: OTP email sent to ${email} (Resend ID: ${data.id})`);
  return data;
};

