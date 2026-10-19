import nodemailer from 'nodemailer';

let transporter = null;

export const getMailerTransporter = async () => {
  if (transporter) return transporter;

  const hasCredentials = process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasCredentials) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      service: 'gmail',
      // port: Number(process.env.SMTP_PORT) || 587,
      // secure: Number(process.env.SMTP_PORT) === 465,
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development mode fallback: test account or console logger
    console.log('[Mailer]: No SMTP credentials provided in .env. Using mock transporter (OTP will be printed to console).');
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('\n=================== [DEV EMAIL SENT] ===================');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Body:\n${mailOptions.text || mailOptions.html}`);
        console.log('========================================================\n');
        return { messageId: 'dev-mock-id-' + Date.now() };
      }
    };
  }

  return transporter;
};

export const sendOtpEmail = async (email, otp, role = 'individual') => {
  const mailer = await getMailerTransporter();
  const roleTitle = role === 'bulk_institution' ? 'Institutional Partner / Bulk Seller' : 'Individual Recycler';

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Innotech E-Waste" <no-reply@innotech.recycle>',
    to: email,
    subject: `Your Innotech E-Waste OTP Code: ${otp}`,
    text: `Your OTP for logging in as ${roleTitle} is ${otp}. This code is valid for 10 minutes.`,
    html: `
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
    `
  };

  return await mailer.sendMail(mailOptions);
};
