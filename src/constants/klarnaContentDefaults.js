/** Klarna badge copy — mirrors production nuvisa.co.uk */
export const KLARNA_CONTENT_DEFAULTS = {
  heading: 'Pay in small instalments with interest free financing!',
  subtitle: 'Pay in 3 payments at 0% interest',
  paymentAmount: '',
  interestRate: '',
  fees: 'No fees',
};

export function mergeKlarnaContent(data) {
  if (!data) return { ...KLARNA_CONTENT_DEFAULTS };
  return {
    heading: data.heading?.trim() || KLARNA_CONTENT_DEFAULTS.heading,
    subtitle: data.subtitle?.trim() || KLARNA_CONTENT_DEFAULTS.subtitle,
    paymentAmount:
      data.paymentAmount?.trim() || KLARNA_CONTENT_DEFAULTS.paymentAmount,
    interestRate:
      data.interestRate?.trim() || KLARNA_CONTENT_DEFAULTS.interestRate,
    fees: data.fees?.trim() || KLARNA_CONTENT_DEFAULTS.fees,
  };
}
