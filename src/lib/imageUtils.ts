import { API_URL } from './api';

/**
 * Helper function to get the full URL for an image
 * @param imageUrl - The image URL (can be relative or absolute)
 * @returns The full image URL
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) {
    // Return a default placeholder image
    return "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop";
  }
  
  // If it's already a full URL (starts with http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Otherwise, prepend the API_URL
  return `${API_URL}${imageUrl}`;
}

/**
 * Helper function to get avatar URL with fallback
 * @param avatarUrl - The avatar URL
 * @param seed - Optional seed for generating a unique avatar
 * @returns The avatar URL or a generated avatar
 */
export function getAvatarUrl(avatarUrl: string | null | undefined, seed?: string): string {
  if (!avatarUrl) {
    // Generate a random avatar based on seed or random string
    const avatarSeed = seed || Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
  }
  
  return getImageUrl(avatarUrl);
}
