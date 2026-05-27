/** Shared in-memory cache reset for homepage/header/content-home proxies. */

let homepageCache = { data: null, expiresAt: 0 };
const headerCacheStore = new Map();
const sliderCacheStore = new Map();
let contentHomeCache = { data: null, expiresAt: 0 };
let faqsCache = { key: "", data: null, expiresAt: 0 };
let occasionResponseCache = { data: null, expiresAt: 0 };

export function getHomepageCache() {
  return homepageCache;
}

export function setHomepageCache(next) {
  homepageCache = next;
}

export function getHeaderCacheStore() {
  return headerCacheStore;
}

export function getSliderCacheStore() {
  return sliderCacheStore;
}

export function getContentHomeCache() {
  return contentHomeCache;
}

export function setContentHomeCache(next) {
  contentHomeCache = next;
}

export function getFaqsCache() {
  return faqsCache;
}

export function setFaqsCache(next) {
  faqsCache = next;
}

export function getOccasionResponseCache() {
  return occasionResponseCache;
}

export function setOccasionResponseCache(next) {
  occasionResponseCache = next;
}

export function clearContentApiCaches() {
  homepageCache = { data: null, expiresAt: 0 };
  headerCacheStore.clear();
  sliderCacheStore.clear();
  contentHomeCache = { data: null, expiresAt: 0 };
  faqsCache = { key: "", data: null, expiresAt: 0 };
  occasionResponseCache = { data: null, expiresAt: 0 };
}
