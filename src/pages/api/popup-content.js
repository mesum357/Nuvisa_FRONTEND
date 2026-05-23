import prisma from '@/lib/prisma';

const POPUP_STATE_KEY = 'popup_state';
const DEFAULT_POPUP_STATE = {
  isActive: true,
  triggerDelaySeconds: 145,
  showOnDates: [],
};

const parsePopupState = (value) => {
  if (!value) return DEFAULT_POPUP_STATE;

  try {
    const parsed = JSON.parse(value);
    return {
      isActive:
        typeof parsed?.isActive === 'boolean'
          ? parsed.isActive
          : DEFAULT_POPUP_STATE.isActive,
      triggerDelaySeconds: Math.max(
        0,
        Number(parsed?.triggerDelaySeconds) || DEFAULT_POPUP_STATE.triggerDelaySeconds
      ),
      showOnDates: Array.isArray(parsed?.showOnDates)
        ? parsed.showOnDates.map((d) => String(d).trim()).filter((d) => d.length > 0)
        : [],
    };
  } catch {
    return DEFAULT_POPUP_STATE;
  }
};

const DEFAULT_POPUP_CONTENT = {
  id: 'current',
  isActive: true,
  triggerDelaySeconds: 145,
  showOnDates: [],
  mainHeading: '❤️ NEW CUSTOMER OFFER - £129 fee for your first visa',
  subHeading: 'Auto-booking appointment',
  offerPrice: '£129',
  originalPrice: '£100',
  continueButtonText: 'Continue',
  lastQuestionButtonText: 'Check Required Documents',
  imageUrl: '/image/popupnew.png',
  conciergeTitle: 'Concierge Assistance',
  conciergePrice: '£35',
  conciergeOfferPrice: 'Free',
  lastChanceText: 'Last chance (ends soon) Until {month} {year}!',
  questions: [
    { id: 'q1', text: 'Status in United Kingdom', type: 'OPTIONS', options: ['UK BRP', 'UK ILR', 'UK BRC', 'UK Citizen'], order: 0 },
    { id: 'q2', text: 'Schengen visa refused during the past three years?', type: 'OPTIONS', options: ['Yes', 'No'], order: 1 },
    { id: 'q3', text: 'Main purpose of the journey', type: 'TEXT', options: [], order: 2 },
    { id: 'q4', text: 'Help us with your Phone Number', type: 'TEXT', options: [], order: 3 },
  ],
};

async function fetchFromAdmin() {
  const { getAdminApiBase } = await import('@/utils/adminApiBase');
  const adminUrl = getAdminApiBase().replace(/\/+$/, '');
  const response = await fetch(`${adminUrl}/api/popup-content`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Admin popup-content responded with ${response.status}`);
  }

  const json = await response.json();
  if (!json?.success || !json?.data) {
    throw new Error('Invalid admin popup-content payload');
  }

  return json.data;
}

async function fetchFromDatabase() {
  let content = await prisma.popupContent.findUnique({
    where: { id: 'current' },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!content) {
    content = await prisma.popupContent.create({
      data: {
        id: 'current',
        mainHeading: DEFAULT_POPUP_CONTENT.mainHeading,
        subHeading: DEFAULT_POPUP_CONTENT.subHeading,
        offerPrice: DEFAULT_POPUP_CONTENT.offerPrice,
        originalPrice: DEFAULT_POPUP_CONTENT.originalPrice,
        continueButtonText: DEFAULT_POPUP_CONTENT.continueButtonText,
        lastQuestionButtonText: DEFAULT_POPUP_CONTENT.lastQuestionButtonText,
        imageUrl: DEFAULT_POPUP_CONTENT.imageUrl,
        conciergeTitle: DEFAULT_POPUP_CONTENT.conciergeTitle,
        conciergePrice: DEFAULT_POPUP_CONTENT.conciergePrice,
        conciergeOfferPrice: DEFAULT_POPUP_CONTENT.conciergeOfferPrice,
        lastChanceText: DEFAULT_POPUP_CONTENT.lastChanceText,
        questions: {
          create: DEFAULT_POPUP_CONTENT.questions.map((q) => ({
            text: q.text,
            type: q.type,
            options: q.options,
            order: q.order,
          })),
        },
      },
      include: {
        questions: { orderBy: { order: 'asc' } },
      },
    });
  }

  const popupStateContent = await prisma.siteContent.findUnique({
    where: { key: POPUP_STATE_KEY },
  });
  const popupState = parsePopupState(popupStateContent?.value);

  return { ...content, ...popupState };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      if (process.env.DATABASE_URL) {
        const data = await fetchFromDatabase();
        return res.status(200).json({ success: true, data });
      }

      const data = await fetchFromAdmin();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.warn('Using fallback popup content:', error?.message || error);
      return res.status(200).json({ success: true, data: DEFAULT_POPUP_CONTENT });
    }
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}
