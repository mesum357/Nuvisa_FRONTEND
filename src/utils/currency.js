// Currency conversion utilities for the visa application
export const CURRENCY_RATES = {
  EUR_TO_INR: 90.5,
  INR_TO_EUR: 1 / 90.5,
  GBP_TO_EUR: 1.17,
  EUR_TO_GBP: 1 / 1.17,
  GBP_TO_INR: 110.0,
  INR_TO_GBP: 1 / 110.0,
};

// Payment method configurations with fees
export const PAYMENT_METHODS = [
  {
    id: "stripe",
    name: "Credit/Debit Card",
    description: "Secure payment via Stripe",
    fee: 0,
  },
  {
    id: "apple_pay",
    name: "Apple Pay",
    description: "Pay with Touch ID or Face ID",
    fee: 0,
  },
  {
    id: "google_pay",
    name: "Google Pay",
    description: "Fast and secure payment",
    fee: 0,
  },
  {
    id: "klarna",
    name: "Klarna",
    description: "Pay in 3 or spread over time",
    fee: 2.99,
  },
];

// Calculate payment fees with currency conversion
export const calculatePaymentFees = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  let conversionRate = 1;

  if (fromCurrency === 'INR' && toCurrency === 'EUR') {
    conversionRate = CURRENCY_RATES.INR_TO_EUR;
  } else if (fromCurrency === 'EUR' && toCurrency === 'INR') {
    conversionRate = CURRENCY_RATES.EUR_TO_INR;
  } else if (fromCurrency === 'GBP' && toCurrency === 'EUR') {
    conversionRate = CURRENCY_RATES.GBP_TO_EUR;
  } else if (fromCurrency === 'EUR' && toCurrency === 'GBP') {
    conversionRate = CURRENCY_RATES.EUR_TO_GBP;
  } else if (fromCurrency === 'GBP' && toCurrency === 'INR') {
    conversionRate = CURRENCY_RATES.GBP_TO_INR;
  } else if (fromCurrency === 'INR' && toCurrency === 'GBP') {
    conversionRate = CURRENCY_RATES.INR_TO_GBP;
  }

  return Math.round((amount * conversionRate) * 100) / 100;
};

// Format currency with proper symbols
export const formatCurrency = (amount, currency) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  switch (currency) {
    case 'EUR':
      return `£${formattedAmount}`;
    case 'GBP':
      return `£${formattedAmount}`;
    case 'INR':
      return `₹${formattedAmount}`;
    default:
      return `${formattedAmount} ${currency}`;
  }
};

// Get payment method fee
export const getPaymentMethodFee = (methodId) => {
  const method = PAYMENT_METHODS.find(m => m.id === methodId);
  return method ? method.fee : 0;
};

// Validate coupon code (client-side validation)
export const validateCouponCode = async (code) => {
  try {
    // This would typically call your backend API
    // For now, we'll implement basic client-side validation
    const validCoupons = {
      'STUDENT10': { valid: true, discount: 10, description: 'Student Discount' },
      'SAVE10': { valid: true, discount: 10, description: '10% Discount' },
      'GROUP20': { valid: true, discount: 20, description: 'Group Discount (3+ travelers)' },
      'WELCOME15': { valid: true, discount: 15, description: 'Welcome Discount' },
    };

    const coupon = validCoupons[code.toUpperCase()];
    if (coupon) {
      return {
        valid: true,
        discount: coupon.discount,
        description: coupon.description,
        message: `Coupon applied: ${coupon.discount}% off`
      };
    }

    return {
      valid: false,
      message: 'Invalid coupon code'
    };
  } catch (error) {
    console.error('Coupon validation error:', error);
    return {
      valid: false,
      message: 'Failed to validate coupon'
    };
  }
};

// Apply coupon discount
export const applyCouponDiscount = (amount, couponCode) => {
  const discounts = {
    'STUDENT10': 0.10,
    'SAVE10': 0.10,
    'GROUP20': 0.20,
    'WELCOME15': 0.15,
  };

  const discountRate = discounts[couponCode.toUpperCase()] || 0;
  return Math.round((amount * discountRate) * 100) / 100;
};

// Calculate total with coupon and payment method fees
export const calculateTotalWithFees = (subtotal, couponCode, paymentMethodId, currency = 'EUR') => {
  let total = subtotal;

  // Apply coupon discount
  if (couponCode) {
    const discountAmount = applyCouponDiscount(subtotal, couponCode);
    total -= discountAmount;
  }

  // Add payment method fee
  const paymentFee = getPaymentMethodFee(paymentMethodId);
  if (paymentFee > 0) {
    total += calculatePaymentFees(paymentFee, 'EUR', currency);
  }

  return Math.max(0, Math.round(total * 100) / 100);
};