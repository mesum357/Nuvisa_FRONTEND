/** Shared in-memory cache reset for homepage/header/content-home proxies. */

let homepageCache = { data: null, expiresAt: 0 };
const headerCacheStore = new Map();
let contentHomeCache = { data: null, expiresAt: 0 };

export function getHomepageCache() {
  return homepageCache;
}

export function setHomepageCache(next) {
  homepageCache = next;
}

export function getHeaderCacheStore() {
  return headerCacheStore;
}

export function getContentHomeCache() {
  return contentHomeCache;
}

export function setContentHomeCache(next) {
  contentHomeCache = next;
}

export function clearContentApiCaches() {
  homepageCache = { data: null, expiresAt: 0 };
  headerCacheStore.clear();
  contentHomeCache = { data: null, expiresAt: 0 };
}
