/** Process section copy — mirrors production nuvisa.co.uk */
export const PROCESS_CONTENT_DEFAULTS = {
  heading: "We're process driven\nBuckle up",
  description:
    'Benefit from document pre-checks, error-proof form filling, and personalized visa guidance, powered by AI with human oversight at critical checkpoints - all designed to prevent delays, mistakes, and rejections.',
  steps: [
    {
      title: 'Checkout',
      description:
        'Confirm the required documents and checkout to lay the foundation. Upload documents securely and complete your details as per your travel history, financial status & occupation.',
    },
    {
      title: 'Build',
      description:
        'Experienced professionals who know exactly what is needed and how to get it done right - review and create a complete application, allowing our customers to benefit from 99.3% approval rate.',
    },
    {
      title: 'Submit',
      description:
        'NUvisa books your appointment. Submit all gathered documents & provide biometrics details at your appointment. We will be with you every step of the way, providing ongoing support to maximise your success.',
    },
    {
      title: 'Approved',
      description:
        'Your Schengen visa will be processed within 5–15 working days, and your passport complete with the Schengen tourist visa stamp will be delivered directly to your doorstep.',
    },
  ],
};

export function mergeProcessContent(data) {
  if (!data) {
    return {
      heading: PROCESS_CONTENT_DEFAULTS.heading,
      description: PROCESS_CONTENT_DEFAULTS.description,
      steps: PROCESS_CONTENT_DEFAULTS.steps.map((step) => ({ ...step })),
    };
  }

  return {
    heading: data.heading?.trim() || PROCESS_CONTENT_DEFAULTS.heading,
    description:
      data.description?.trim() || PROCESS_CONTENT_DEFAULTS.description,
    steps: PROCESS_CONTENT_DEFAULTS.steps.map((step, index) => ({
      title: data.steps?.[index]?.title?.trim() || step.title,
      description:
        data.steps?.[index]?.description?.trim() || step.description,
    })),
  };
}
