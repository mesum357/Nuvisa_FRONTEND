// Simple FAQ API route for frontend fallback
// This provides the same FAQ data as hardcoded in the component

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const faqs = [
    {
      id: '1',
      question: "What documents do I need for a Schengen visa application?",
      answer: "You'll need a valid passport, completed application form, recent passport-sized photos, travel insurance, proof of accommodation, flight itinerary, financial proof, and travel purpose documents (invitation letter, tour details, etc.).",
      category: "Documents",
      order: 1,
      isActive: true,
    },
    {
      id: '2',
      question: "How long does it take to process a Schengen visa?",
      answer: "Typically 15 calendar days from your appointment date, but it can take up to 30 days in some cases or even 60 days for exceptional cases. We recommend applying at least 4 weeks before your planned travel date.",
      category: "Processing",
      order: 2,
      isActive: true,
    },
    {
      id: '3',
      question: "Can I apply for a Schengen visa without flight tickets?",
      answer: "While actual tickets aren't required, you must provide a confirmed flight reservation or itinerary showing your intended dates and route. We can help you obtain this without purchasing full tickets.",
      category: "Documents",
      order: 3,
      isActive: true,
    },
    {
      id: '4',
      question: "What's the minimum bank balance required?",
      answer: "Requirements vary by country but generally you should show £60-100 per day of your stay. For a 10-day trip, that would be £600-1000 in your bank account or equivalent in your local currency.",
      category: "Financial",
      order: 4,
      isActive: true,
    },
    {
      id: '5',
      question: "Can I extend my Schengen visa while in Europe?",
      answer: "Extensions are only granted in exceptional cases like force majeure, humanitarian reasons, or serious personal circumstances. Tourist visas generally cannot be extended - you must return before your visa expires.",
      category: "General",
      order: 5,
      isActive: true,
    },
    {
      id: '6',
      question: "What if my visa application gets rejected?",
      answer: "You'll receive a letter stating the reason. You can either appeal the decision (within 3 weeks) or reapply with stronger documentation addressing the refusal reasons. Our experts can review your case and suggest improvements.",
      category: "General",
      order: 6,
      isActive: true,
    },
    {
      id: '7',
      question: "Do children need separate Schengen visas?",
      answer: "Yes, all travelers including infants and children need their own visa. The process is similar but requires additional documents like birth certificates and consent letters from non-traveling parents.",
      category: "General",
      order: 7,
      isActive: true,
    },
  ];

  res.status(200).json({
    success: true,
    data: faqs,
  });
}
