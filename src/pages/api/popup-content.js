import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      let content = await prisma.popupContent.findUnique({
        where: { id: 'current' },
        include: {
          questions: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      if (!content) {
        // If no content exists at all, create it with questions
        content = await prisma.popupContent.create({
          data: {
            id: 'current',
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
            lastChanceText: 'Last chance (ends soon) Until Jan 2026!',
            questions: {
              create: [
                { text: 'Status in United Kingdom', type: 'OPTIONS', options: ['UK BRP', 'UK ILR', 'UK BRC', 'UK Citizen'], order: 0 },
                { text: 'Schengen visa refused during the past three years?', type: 'OPTIONS', options: ['Yes', 'No'], order: 1 },
                { text: 'Main purpose of the journey', type: 'TEXT', options: [], order: 2 },
                { text: 'Help us with your Phone Number', type: 'TEXT', options: [], order: 3 },
              ]
            }
          },
           include: {
              questions: {
                orderBy: {
                  order: 'asc',
                },
              },
           },
        });
      } else if (content.questions.length === 0) {
        // If content exists but questions are missing, create them
        await prisma.popupQuestion.createMany({
          data: [
            { text: 'Status in United Kingdom', type: 'OPTIONS', options: ['UK BRP', 'UK ILR', 'UK BRC', 'UK Citizen'], order: 0, popupContentId: 'current' },
            { text: 'Schengen visa refused during the past three years?', type: 'OPTIONS', options: ['Yes', 'No'], order: 1, popupContentId: 'current' },
            { text: 'Main purpose of the journey', type: 'TEXT', options: [], order: 2, popupContentId: 'current' },
            { text: 'Help us with your Phone Number', type: 'TEXT', options: [], order: 3, popupContentId: 'current' },
          ]
        });
        // Refetch the content with the newly created questions
        content = await prisma.popupContent.findUnique({
            where: { id: 'current' },
            include: {
              questions: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
        });
      }

      return res.status(200).json({ success: true, data: content });
    } catch (error) {
      console.error("Error fetching popup content:", error);
      return res.status(500).json({ success: false, error: 'Failed to fetch content' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
