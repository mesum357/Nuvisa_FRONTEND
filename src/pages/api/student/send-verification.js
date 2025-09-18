import crypto from "crypto";

// Simple in-memory store for demo purposes. For production use a persistent store (Redis, DB).
const codes = global.__STUDENT_VERIFICATION_CODES ||= new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Email is required" });

  // Create a 6-digit numeric code
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Store with TTL (10 minutes)
  const expiresAt = Date.now() + 10 * 60 * 1000;
  codes.set(email, { code, expiresAt });

  // If SENDGRID_API_KEY is provided, attempt to send the mail
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (SENDGRID_API_KEY) {
    try {
      // Use SendGrid HTTP API directly to avoid bundling @sendgrid/mail on serverless builds
      const sgUrl = "https://api.sendgrid.com/v3/mail/send";
      const payload = {
        personalizations: [
          { to: [{ email }] }
        ],
        from: { email: process.env.SENDGRID_FROM || "no-reply@nuvisa.example" },
        subject: "Your NuVisa student verification code",
        content: [
          { type: "text/plain", value: `Your verification code is: ${code}. It will expire in 10 minutes.` },
          { type: "text/html", value: `<p>Your verification code is: <strong>${code}</strong>.</p><p>It will expire in 10 minutes.</p>` }
        ]
      };

      const resp = await fetch(sgUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error("SendGrid send error:", resp.status, text);
        // fall through to return debugCode in dev
      } else {
        return res.status(200).json({ ok: true });
      }
    } catch (err) {
      console.error("SendGrid send error:", err);
      // Fallthrough to return code in response as fallback
    }
  }

  // For dev/no-key: return the code in the response (do not do this in production)
  return res.status(200).json({ ok: true, debugCode: code });
}
