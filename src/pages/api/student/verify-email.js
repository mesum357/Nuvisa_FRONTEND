// In-memory token store must match the one used by send-verification
const verificationTokens = global.__STUDENT_VERIFICATION_TOKENS ||= new Map();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  const record = verificationTokens.get(token);
  if (!record) {
    return res.status(400).json({ error: "Invalid or expired verification token" });
  }

  if (Date.now() > record.expiresAt) {
    verificationTokens.delete(token);
    return res.status(400).json({ error: "Verification token has expired" });
  }

  // Mark as verified and store the verified email
  record.verified = true;
  record.verifiedAt = Date.now();

  // Also store by email for easy lookup (keep for 24 hours)
  const verifiedEmails = global.__VERIFIED_STUDENT_EMAILS ||= new Map();
  verifiedEmails.set(record.email, {
    verified: true,
    verifiedAt: record.verifiedAt,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  });

  // Clean up the token
  verificationTokens.delete(token);

  // Return HTML success page instead of JSON for better UX
  const returnToParam = typeof req !== 'undefined' && req.query && req.query.returnTo ? String(req.query.returnTo) : '';
  // Default redirect after verification when opened directly (no returnTo): send to /get-the-visa
  const defaultRedirect = `${(process.env.NEXTAUTH_URL || '') ? process.env.NEXTAUTH_URL.replace(/\/$/, '') : ''}/get-the-visa`;

  const successPage = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Email Verified - NuVisa</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          max-width: 500px;
          background-color: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          text-align: center;
        }
        .success-icon {
          width: 64px;
          height: 64px;
          background-color: #10b981;
          border-radius: 50%;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .checkmark {
          color: white;
          font-size: 32px;
          font-weight: bold;
        }
        h1 {
          color: #1f2937;
          margin-bottom: 16px;
          font-size: 24px;
        }
        p {
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .email {
          background-color: #f3f4f6;
          padding: 12px;
          border-radius: 4px;
          color: #1f2937;
          font-weight: 600;
          margin-bottom: 24px;
        }
        .button {
          background-color: #2563eb;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          display: inline-block;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">
          <span class="checkmark">✓</span>
        </div>
        <h1>Email Verified Successfully!</h1>
        <p>Your student email address has been verified:</p>
        <div class="email">${record.email}</div>
        <p>You can now close this window and return to NuVisa to complete your application with the student discount.</p>
        <a href="/get-the-visa" class="button">Return to NuVisa</a>
      </div>
      <script>
        // Store a client-side flag so returning users see their verified state on the site
        try {
          const key = 'nuvisa.verifiedStudentEmail';
          const payload = {
            email: ${JSON.stringify(record.email)},
            verifiedAt: ${record.verifiedAt},
            expiresAt: ${record.verifiedAt + 24 * 60 * 60 * 1000}
          };
          try {
            localStorage.setItem(key, JSON.stringify(payload));
          } catch (err) {
            // ignore storage errors (e.g. Safari private mode)
          }

          // Notify opener window (if any) that verification succeeded.
          const message = { type: 'student-email-verified', email: ${JSON.stringify(record.email)} };
          if (window.opener && !window.opener.closed) {
            // Use postMessage for cross-window communication
            window.opener.postMessage(message, '*');
          }
        } catch (e) {
          // ignore
        }

        // Auto-close after a short delay if opened in popup, otherwise redirect to returnTo if provided
        const returnTo = ${returnToParam ? JSON.stringify(returnToParam) : 'null'};
        const defaultRedirect = ${JSON.stringify(defaultRedirect)};
        if (window.opener) {
          setTimeout(() => {
            window.close();
          }, 3000);
        } else if (returnTo) {
          // Redirect the top window to the provided returnTo
          setTimeout(() => {
            try { window.location.href = returnTo; } catch (e) { /* ignore */ }
          }, 1200);
        } else {
          // No returnTo - redirect to default "get-the-visa" page
          setTimeout(() => {
            try { window.location.href = defaultRedirect; } catch (e) { /* ignore */ }
          }, 1200);
        }
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(successPage);
}