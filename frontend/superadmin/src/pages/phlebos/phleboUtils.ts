export const AVATAR_PALETTE = [
  "#0d9488",
  "#7c3aed",
  "#2563eb",
  "#e34980",
  "#16a34a",
  "#eda100",
  "#0891b2",
  "#9333ea",
];

export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getAvatarColor(id: string): string {
  return AVATAR_PALETTE[hashId(id) % AVATAR_PALETTE.length];
}
