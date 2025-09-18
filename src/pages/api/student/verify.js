// In-memory codes map must match the one used by send-verification
const codes = global.__STUDENT_VERIFICATION_CODES ||= new Map();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, code } = req.body || {};
  if (!email || !code) return res.status(400).json({ error: "Email and code are required" });

  const record = codes.get(email);
  if (!record) return res.status(400).json({ error: "No code found or expired" });

  if (Date.now() > record.expiresAt) {
    codes.delete(email);
    return res.status(400).json({ error: "Code expired" });
  }

  if (String(code) !== String(record.code)) {
    return res.status(400).json({ error: "Invalid code" });
  }

  // Success - remove code to prevent reuse
  codes.delete(email);
  return res.status(200).json({ verified: true });
}
