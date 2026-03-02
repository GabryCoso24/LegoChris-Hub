// API Configuration
// Use same-origin paths by default to avoid mixed-content when frontend is HTTPS.
// Set VITE_API_URL for production or when a full URL is required.

const rawApiUrl = import.meta.env.VITE_API_URL || "";
export const API_URL = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;

export const API_ENDPOINTS = {
  videos: `${API_URL}/api/videos`,
  playlists: `${API_URL}/api/playlists`,
  products: `${API_URL}/api/products`,
  team: `${API_URL}/api/team`,
  staff: `${API_URL}/api/staff`,
  events: `${API_URL}/api/events`,
  schedule: `${API_URL}/api/schedule`,
  teamPlusSchedule: `${API_URL}/api/team-plus-schedule`,
  newsletter: `${API_URL}/api/newsletter`,
  upload: `${API_URL}/api/upload`,
  userOrders: `${API_URL}/api/user-orders`,
  createCheckoutSession: `${API_URL}/api/create-checkout-session`,
  checkNickname: `${API_URL}/api/check-nickname`,
  profile: `${API_URL}/api/profile`,
} as const;
