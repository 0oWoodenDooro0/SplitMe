export const AVATAR_PALETTE = [
  '#10B981', // Emerald
  '#0EA5E9', // Sky
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#EC4899', // Pink
  '#84CC16', // Lime
];

export function getRandomAvatarColor(usedColors: string[] = []): string {
  const available = AVATAR_PALETTE.filter((c) => !usedColors.includes(c));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];
}
