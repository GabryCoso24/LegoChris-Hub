// API Configuration
// Use same-origin paths by default to avoid mixed-content when frontend is HTTPS.
// Set VITE_API_URL for production or when a full URL is required.

const rawApiUrl = import.meta.env.VITE_API_URL || "";
export const API_URL = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;

export const API_ENDPOINTS = {
  botConfig: `${API_URL}/api/bot/config`,
  botStatus: `${API_URL}/api/bot/status`,
  botStart: `${API_URL}/api/bot/start`,
  botStop: `${API_URL}/api/bot/stop`,
  botRestart: `${API_URL}/api/bot/restart`,
  botLogs: `${API_URL}/api/bot/logs`,
  botLogsStream: `${API_URL}/api/bot/logs/stream`,
  botFiles: `${API_URL}/api/bot/files`,
  botFile: `${API_URL}/api/bot/file`,
  botFileRename: `${API_URL}/api/bot/file/rename`,
  botTerminalExec: `${API_URL}/api/bot/terminal/exec`,
  botTerminalSession: `${API_URL}/api/bot/terminal/session`,
  botModules: `${API_URL}/api/bot/modules`,
  botBuilderFlows: `${API_URL}/api/bot/builder/flows`,
  botBuilderDeleteFlow: `${API_URL}/api/bot/builder/flows`,
  botBuilderCompile: `${API_URL}/api/bot/builder/compile`,
  botBuilderSaveSource: `${API_URL}/api/bot/builder/save-source`,
  videos: `${API_URL}/api/videos`,
  videosReorder: `${API_URL}/api/videos/reorder`,
  playlists: `${API_URL}/api/playlists`,
  playlistsReorder: `${API_URL}/api/playlists/reorder`,
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
