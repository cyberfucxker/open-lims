/** Curated Unsplash CDN photos used for the marketing home page. Swap for
 *  branded photography whenever the real assets are ready — these are
 *  hot-linked stock images, not locally bundled files. */

function unsplash(id: string, params = "w=1200&q=80&auto=format&fit=crop") {
  return `https://images.unsplash.com/photo-${id}?${params}`;
}

export const STOCK_IMAGES = {
  labInterior: unsplash("1579154204601-01588f351e67"),
  labAnalysts: unsplash("1579154204601-01588f351e67"),
  downloadReport: unsplash("1576091160550-2173dba999ef"),
  nightLab: unsplash("1666214280391-8ff5bd3c0bf0"),
  doctorPortrait: unsplash("1612349317150-e413f6a5b16d"),
};

export function patientAvatar(id: number) {
  return `https://i.pravatar.cc/150?img=${id}`;
}
