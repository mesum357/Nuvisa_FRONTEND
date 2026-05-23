const ADMIN_API_URL = (
  process.env.NEXT_PUBLIC_ADMIN_API_URL ||
  process.env.ADMIN_API_URL ||
  'http://localhost:3001'
).replace(/\/+$/, '');

const DEFAULT_EXIT_INTENT = {
  isActive: true,
  heading: 'Wait — still planning your trip?',
  body: 'Get expert help with your visa application. Limited daily slots available.',
  ctaText: 'Continue application',
  ctaUrl: '/get-the-visa',
};

export default async function handler(_req, res) {
  try {
    const upstream = await fetch(
      `${ADMIN_API_URL}/api/content?key=exit_intent_popup`,
      { cache: 'no-store' }
    );
    if (!upstream.ok) {
      return res.status(200).json({ success: true, data: DEFAULT_EXIT_INTENT });
    }
    const json = await upstream.json();
    const raw = json?.data?.value;
    if (!raw) {
      return res.status(200).json({ success: true, data: DEFAULT_EXIT_INTENT });
    }
    const parsed = JSON.parse(raw);
    return res.status(200).json({
      success: true,
      data: { ...DEFAULT_EXIT_INTENT, ...parsed },
    });
  } catch {
    return res.status(200).json({ success: true, data: DEFAULT_EXIT_INTENT });
  }
}
