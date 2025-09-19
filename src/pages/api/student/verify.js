// In-memory verified emails store
const verifiedEmails = global.__VERIFIED_STUDENT_EMAILS ||= new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const record = verifiedEmails.get(email);
  if (!record) {
    return res.status(400).json({ 
      error: "Email not verified. Please check your email for the verification link." 
    });
  }

  if (Date.now() > record.expiresAt) {
    verifiedEmails.delete(email);
    return res.status(400).json({ 
      error: "Email verification has expired. Please request a new verification email." 
    });
  }

  if (!record.verified) {
    return res.status(400).json({ 
      error: "Email verification is pending. Please check your email and click the verification link." 
    });
  }

  // Success - email is verified and valid
  return res.status(200).json({ 
    verified: true,
    verifiedAt: record.verifiedAt
  });
}
