
import crypto from "crypto";
import sgMailLib from '@sendgrid/mail';

// Simple in-memory store for demo purposes. For production use a persistent store (Redis, DB).
const verificationTokens = global.__STUDENT_VERIFICATION_TOKENS ||= new Map();

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check if email is from an educational institution
function isEducationalEmail(email) {
  const educationalDomains = [
    '.edu', '.ac.uk', '.edu.au', '.edu.ca', '.ac.nz', '.edu.sg',
    '.uni-', '.university', '.college', '.ac.', '.edu.'
  ];
  return educationalDomains.some(domain => email.toLowerCase().includes(domain));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body || {};
  // Optional return URL where the user should be redirected after verification
  const { returnTo } = req.body || {};
  
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }
  
  if (!isEducationalEmail(email)) {
    return res.status(400).json({ 
      error: "Please use your educational institution email address (.edu, .ac.uk, etc.)" 
    });
  }

  // Generate secure verification token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 30 * 60 * 1000; 

  // Store token with email and expiry
  verificationTokens.set(token, { 
    email, 
    expiresAt,
    verified: false 
  });

  // Create verification URL
  // Prefer NEXTAUTH_URL if explicitly set (should include protocol)
  let baseUrl = process.env.NEXTAUTH_URL || null;
  if (!baseUrl) {
    const host = req.headers && req.headers.host ? req.headers.host : 'localhost:3000';
    // Use http for common local hosts to avoid ERR_SSL_PROTOCOL_ERROR in dev
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host === '::1';
    const protocol = isLocalhost ? 'http' : 'https';
    baseUrl = `${protocol}://${host}`;
  }
  // Allow optional returnTo but only if it's same-origin or a whitelisted host
  const allowedReturnHosts = (process.env.VERIFY_RETURN_HOSTS || '').split(',').map(s => s.trim()).filter(Boolean);
  let verifiedReturnTo = '';
  try {
    if (returnTo) {
      const u = new URL(returnTo, baseUrl);
      const host = u.host;
      // allow same origin OR whitelisted hosts
      if (host === new URL(baseUrl).host || allowedReturnHosts.includes(host)) {
        verifiedReturnTo = u.toString();
      }
    }
  } catch (e) {
    // ignore invalid URL
    verifiedReturnTo = '';
  }

  const verificationUrl = `${baseUrl}/api/student/verify-email?token=${token}${verifiedReturnTo ? `&returnTo=${encodeURIComponent(verifiedReturnTo)}` : ''}`;

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.SENDGRID_FROM || 'no-reply@nuvisa.com';

  if (SENDGRID_API_KEY) {
    try {
      sgMailLib.setApiKey(SENDGRID_API_KEY);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Verify Your Student Email - NuVisa</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">NuVisa</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Student Verification</p>
            </div>
            
            <div style="margin-bottom: 40px;">
              <h2 style="color: #1f2937; margin-bottom: 16px;">Verify Your Student Email</h2>
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
                Thank you for applying for our student discount! We need to verify that you're using a valid educational email address.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  Verify My Email Address
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, you can copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                This verification link will expire in 30 minutes for security reasons.<br>
                If you didn't request this verification, please ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
        Verify Your Student Email - NuVisa
        
        Thank you for applying for our student discount! We need to verify that you're using a valid educational email address.
        
        Please click the following link to verify your email:
        ${verificationUrl}
        
        This verification link will expire in 30 minutes for security reasons.
        If you didn't request this verification, please ignore this email.
        
        Best regards,
        The NuVisa Team
      `;

      const msg = {
        to: email,
        from: {
          email: FROM_EMAIL,
          name: 'NuVisa Student Verification'
        },
        subject: 'Verify Your Student Email - NuVisa',
        text: textContent,
        html: htmlContent,
      };

      await sgMailLib.send(msg);

      return res.status(200).json({
        ok: true,
        message: 'Verification email sent successfully. Please check your inbox.'
      });

    } catch (err) {
      console.error('SendGrid send error:', err?.response?.body || err);
      return res.status(500).json({
        error: 'Failed to send verification email. Please try again.'
      });
    }
  }

  // For development without SendGrid key -> return only debug URL & instructive message
  return res.status(200).json({
    ok: true,
    debugUrl: verificationUrl,
    message: 'Development mode: Use the debugUrl to verify (do not return tokens in production)'
  });
}
