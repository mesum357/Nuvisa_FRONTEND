const KEYS = {
  ORDER_ID: 'nuvisa_admin_order_id',
  TRAVELER_ID: 'nuvisa_admin_traveler_id',
};

export function saveOrderId(orderId) {
  if (typeof window === 'undefined') return;
  if (!orderId) return;
  localStorage.setItem(KEYS.ORDER_ID, String(orderId));
}

export function getOrderId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEYS.ORDER_ID);
}

export function saveTravelerId(travelerId) {
  if (typeof window === 'undefined') return;
  if (travelerId === undefined || travelerId === null) return;
  localStorage.setItem(KEYS.TRAVELER_ID, String(travelerId));
}

export function getTravelerId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEYS.TRAVELER_ID);
}

export function clearAdminSearchContext() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.ORDER_ID);
  localStorage.removeItem(KEYS.TRAVELER_ID);
}

export default {
  saveOrderId,
  getOrderId,
  saveTravelerId,
  getTravelerId,
  clearAdminSearchContext,
};
