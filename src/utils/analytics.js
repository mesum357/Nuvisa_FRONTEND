/**
 * Analytics utility for Google Tag Manager, Google Analytics (GA4), and Meta Pixel
 * 
 * GTM ID: GTM-K2KZ5XR4
 * GA4 ID: G-QZ8V1X83W
 * Meta Pixel ID: 8743860119455304
 */

// GTM Data Layer push helper
export const pushToDataLayer = (event, data = {}) => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event,
      ...data,
    });
  }
};

// GA4 gtag helper
export const gtag = (...args) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
};

// Meta Pixel helper
export const fbq = (...args) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args);
  }
};

/**
 * Track Page View event
 * Fires on landing page and route changes
 */
export const trackPageView = (url, title) => {
  // GTM/GA4 - Page View
  pushToDataLayer('page_view', {
    page_location: url,
    page_title: title,
  });

  // GA4 direct
  gtag('event', 'page_view', {
    page_location: url,
    page_title: title,
  });

  // Meta Pixel - PageView
  fbq('track', 'PageView');
};

/**
 * Track Initiate Checkout event
 * Fires when user clicks Apple Pay, Google Pay, or Continue to Checkout
 */
export const trackInitiateCheckout = (data = {}) => {
  const {
    currency = 'GBP',
    value = 0,
    content_name = 'Visa Application',
    content_category = 'Visa',
    num_items = 1,
    email = '',
    country = '',
  } = data;

  // GTM/GA4 - Begin Checkout
  pushToDataLayer('begin_checkout', {
    currency,
    value,
    items: [{
      item_name: content_name,
      item_category: content_category,
      quantity: num_items,
      price: value,
    }],
    user_email: email,
    destination_country: country,
  });

  // GA4 direct
  gtag('event', 'begin_checkout', {
    currency,
    value,
    items: [{
      item_name: content_name,
      item_category: content_category,
      quantity: num_items,
      price: value,
    }],
  });

  // Meta Pixel - InitiateCheckout
  fbq('track', 'InitiateCheckout', {
    currency,
    value,
    content_name,
    content_category,
    num_items,
  });
};

/**
 * Track Purchase / Application Submitted event
 * Fires on payment success page
 */
export const trackPurchase = (data = {}) => {
  const {
    transaction_id = '',
    currency = 'GBP',
    value = 0,
    content_name = 'Visa Application',
    content_category = 'Visa',
    num_items = 1,
    email = '',
    country = '',
  } = data;

  // GTM/GA4 - Purchase
  pushToDataLayer('purchase', {
    transaction_id,
    currency,
    value,
    items: [{
      item_name: content_name,
      item_category: content_category,
      quantity: num_items,
      price: value,
    }],
    user_email: email,
    destination_country: country,
  });

  // GA4 direct
  gtag('event', 'purchase', {
    transaction_id,
    currency,
    value,
    items: [{
      item_name: content_name,
      item_category: content_category,
      quantity: num_items,
      price: value,
    }],
  });

  // Meta Pixel - Purchase
  fbq('track', 'Purchase', {
    currency,
    value,
    content_name,
    content_category,
    num_items,
  });
};

/**
 * Track custom events
 */
export const trackCustomEvent = (eventName, data = {}) => {
  pushToDataLayer(eventName, data);
  gtag('event', eventName, data);
  fbq('trackCustom', eventName, data);
};
