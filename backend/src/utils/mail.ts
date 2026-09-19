import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'Gujarat Post <keeps9278@gmail.com>';

// Initialize Resend client if API key is present
const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

let cachedTransporter: nodemailer.Transporter | null = null;

// Get dynamic Nodemailer SMTP Transporter (Gmail App Password) with pooling & connection reuse
const getSmtpTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, ''); // strip spaces in app password

  if (!smtpUser || !smtpPass) return null;

  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return cachedTransporter;
};

/**
 * Dispatches an OTP verification email to user email.
 */
export const sendOtpEmail = async (toEmail: string, otp: string): Promise<boolean> => {
  const formattedOtp = otp.split('').join(' ');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification - Gujarat Post</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 520px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #B3121B;
            padding: 24px 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 900;
            margin: 0;
            letter-spacing: 1px;
          }
          .body {
            padding: 32px 30px;
            text-align: center;
          }
          .title {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 8px;
          }
          .subtitle {
            font-size: 14px;
            color: #64748b;
            margin-bottom: 24px;
          }
          .otp-box {
            background: #f1f5f9;
            border: 2px dashed #cbd5e1;
            border-radius: 10px;
            padding: 18px 24px;
            margin: 20px 0;
            display: inline-block;
          }
          .otp-code {
            font-family: 'Courier New', Courier, monospace;
            font-size: 34px;
            font-weight: 900;
            letter-spacing: 8px;
            color: #B3121B;
          }
          .expiry {
            font-size: 13px;
            font-weight: 600;
            color: #ef4444;
            margin-top: 16px;
          }
          .notice {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 24px;
            line-height: 1.5;
          }
          .footer {
            background-color: #f8fafc;
            padding: 16px 30px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #f1f5f9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>ગુજરાત પોસ્ટ (Gujarat Post)</h1>
          </div>
          <div class="body">
            <div class="title">તમારો ચકાસણી કોડ (Verification Code)</div>
            <p class="subtitle">ગુજરાત પોસ્ટ પર સાઇન ઇન / ઇમેઇલ ચકાસણી પૂર્ણ કરવા માટે નીચે આપેલા OTP નો ઉપયોગ કરો:</p>
            
            <div class="otp-box">
              <span class="otp-code">${formattedOtp}</span>
            </div>
            
            <div class="expiry">⚠️ આ OTP આગામી 5 મિનિટ સુધી જ માન્ય રહેશે. (Valid for 5 minutes)</div>
            
            <p class="notice">જો તમે આ OTP વિનંતી નથી કરી, તો આ ઇમેઇલને અગણિત કરો. સુરક્ષા માટે આ કોડ કોઇની સાથે શેર કરશો નહીં.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Gujarat Post. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Try sending via Nodemailer SMTP (Gmail App Password)
  const smtpTransporter = getSmtpTransporter();
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: EMAIL_FROM,
        to: toEmail,
        subject: `[Gujarat Post] ${otp} is your Email Verification OTP Code`,
        html: htmlContent,
      });
      console.log(`[SMTP SUCCESS] Verification OTP ${otp} delivered via Gmail to ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error('[SMTP ERROR] Failed to send OTP via Gmail SMTP:', err?.message || err);
    }
  }

  // 2. Fallback to Resend if configured
  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: EMAIL_FROM,
        to: toEmail,
        subject: `[Gujarat Post] ${otp} is your Email Verification OTP Code`,
        html: htmlContent,
      });
      if (!response.error) {
        console.log(`[RESEND SUCCESS] Verification OTP ${otp} delivered to ${toEmail}`);
        return true;
      }
    } catch (err: any) {
      console.error('[RESEND ERROR] Failed to send OTP via Resend:', err?.message || err);
    }
  }

  // 3. Fallback print
  console.log(`\n============================================================`);
  console.log(`[OTP EMAIL FALLBACK] Recipient: ${toEmail} | Code: ${otp}`);
  console.log(`============================================================\n`);
  return true;
};

/**
 * Dispatches an email containing login credentials to the newly created user.
 * Falls back to printing to the console if Resend is not configured or fails.
 */
export const sendCredentialsEmail = async (
  toEmail: string,
  plainPassword: string,
  role: string
): Promise<boolean> => {
  const frontendBase = (process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const loginUrl = `${frontendBase}/login`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Gujarat Post</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f9;
            color: #333333;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            border: 1px solid #e1e8ed;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a, #3b82f6);
            padding: 30px;
            text-align: center;
            color: #ffffff;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
          }
          .welcome-text {
            font-size: 16px;
            margin-bottom: 25px;
          }
          .credentials-box {
            background-color: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
          }
          .credential-row {
            margin-bottom: 10px;
            font-size: 15px;
          }
          .credential-row:last-child {
            margin-bottom: 0;
          }
          .label {
            font-weight: 600;
            color: #475569;
            display: inline-block;
            width: 90px;
          }
          .value {
            font-family: 'Courier New', Courier, monospace;
            font-weight: bold;
            color: #0f172a;
          }
          .cta-container {
            text-align: center;
            margin-top: 35px;
          }
          .cta-button {
            background-color: #3b82f6;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-weight: 600;
            display: inline-block;
            box-shadow: 0 2px 5px rgba(59, 130, 246, 0.3);
          }
          .footer {
            background-color: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>Welcome to Gujarat Post</h1>
          </div>
          <div class="content">
            <p class="welcome-text">Hello,</p>
            <p>An administrator has created an account for you on the <strong>Gujarat Post</strong> Portal. You have been assigned the role of <strong>${role}</strong>.</p>
            
            <p>Below are your account login credentials:</p>
            
            <div class="credentials-box">
              <div class="credential-row">
                <span class="label">Email:</span>
                <span class="value">${toEmail}</span>
              </div>
              <div class="credential-row">
                <span class="label">Password:</span>
                <span class="value">${plainPassword}</span>
              </div>
              <div class="credential-row">
                <span class="label">Role:</span>
                <span class="value">${role}</span>
              </div>
            </div>
            
            <p>Please secure your password and do not share it with others. You will be prompted to log in at the link below:</p>
            
            <div class="cta-container">
              <a href="${loginUrl}" class="cta-button" target="_blank">Go to Admin Portal</a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated system email. Please do not reply directly to this message.</p>
            <p>&copy; ${new Date().getFullYear()} Gujarat Post. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Try sending via SMTP (Gmail)
  const smtpTransporter = getSmtpTransporter();
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: EMAIL_FROM,
        to: toEmail,
        subject: 'Gujarat Post Admin - Credentials Generated',
        html: htmlContent,
      });
      console.log(`[SMTP SUCCESS] Dispatched credentials email via Gmail to: ${toEmail}`);
      return true;
    } catch (err: any) {
      console.error('[SMTP ERROR] Failed to send credentials email via Gmail SMTP:', err?.message || err);
    }
  }

  // 2. Try sending via Resend client
  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: EMAIL_FROM,
        to: toEmail,
        subject: 'Gujarat Post Admin - Credentials Generated',
        html: htmlContent,
      });

      if (response.error) {
        console.error('Resend API returned error:', response.error);
        logEmailFallback(toEmail, plainPassword, role, htmlContent);
        return false;
      }

      console.log(`Successfully dispatched credentials email to: ${toEmail} (ID: ${response.data?.id})`);
      return true;
    } catch (err) {
      console.error('Failed to dispatch email via Resend:', err);
      logEmailFallback(toEmail, plainPassword, role, htmlContent);
      return false;
    }
  } else {
    // 3. Fallback to console print if unconfigured
    logEmailFallback(toEmail, plainPassword, role, htmlContent);
    return true;
  }
};

/**
 * Logs the email details to the console as a fallback in development.
 */
function logEmailFallback(
  toEmail: string,
  plainPassword: string,
  role: string,
  htmlContent: string
) {
  console.log('\n------------------------------------------------------------');
  console.warn('⚠️  EMAIL DEGRADATION FALLBACK (RESEND NOT CONFIGURED/OFFLINE)');
  console.log(`Onboarding credentials for user:`);
  console.log(`- Recipient Email:  ${toEmail}`);
  console.log(`- Plain Password:   ${plainPassword}`);
  console.log(`- Designated Role:  ${role}`);
  console.log('\nHTML Email Preview:');
  console.log(htmlContent.replace(/\s+/g, ' ').trim().substring(0, 500) + '... [truncated]');
  console.log('------------------------------------------------------------\n');
}
