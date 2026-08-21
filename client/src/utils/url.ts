/**
 * Generates the collaborative friend sharing URL for a given room code or ID.
 */
export function buildFriendShareUrl(roomCodeOrId: string, customOrigin?: string): string {
  if (!roomCodeOrId) return '';

  const base =
    customOrigin ||
    (typeof window !== 'undefined' && window.location
      ? `${window.location.origin}${window.location.pathname}`
      : 'http://localhost:5173/');

  const cleanBase = base.split('?')[0].replace(/\/+$/, '');
  return `${cleanBase || '/'}?room=${encodeURIComponent(roomCodeOrId)}&view=friend`;
}
