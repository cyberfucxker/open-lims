import { prisma } from "../../config/database";
import { ApiError } from "../../utils/ApiError";

/** Haversine distance in km — good enough for a nearby-labs sort without
 *  needing a PostGIS extension for this catalog's scale. */
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface CenterListItem {
  id: string;
  center_name: string;
  address: string;
  phone: string | null;
  distance: number | null;
  lat: string;
  long: string;
  is_open: boolean;
}

function isCurrentlyOpen(openingTime: string | null, closingTime: string | null): boolean {
  if (!openingTime || !closingTime) return true;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = openingTime.split(":").map(Number);
  const [closeH, closeM] = closingTime.split(":").map(Number);
  return nowMinutes >= openH * 60 + openM && nowMinutes <= closeH * 60 + closeM;
}

export async function listCenters(lat?: number, long?: number): Promise<CenterListItem[]> {
  const centers = await prisma.serviceCenter.findMany({ where: { isActive: true } });

  const results = centers.map((c) => ({
    id: c.id,
    center_name: c.name,
    address: c.address,
    phone: c.phone,
    distance:
      lat !== undefined && long !== undefined
        ? distanceKm(lat, long, Number(c.latitude), Number(c.longitude))
        : null,
    lat: c.latitude.toString(),
    long: c.longitude.toString(),
    is_open: isCurrentlyOpen(c.openingTime, c.closingTime),
  }));

  if (lat !== undefined && long !== undefined) {
    results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }

  return results;
}

export interface CenterDetail {
  id: string;
  center_name: string;
  center_image: string | null;
  address: string;
  latitude: string;
  longitude: string;
  rating: number;
  review_count: number;
  is_open: boolean;
  opening_time: string | null;
  closing_time: string | null;
  center_type: string | null;
  facilities: unknown;
  payment_methods: unknown;
  website: string | null;
  phone: string | null;
  email: string | null;
  photos: unknown;
}

export async function getCenterDetail(id: string): Promise<CenterDetail> {
  const center = await prisma.serviceCenter.findUnique({ where: { id } });
  if (!center || !center.isActive) {
    throw ApiError.notFound("Center not found");
  }

  return {
    id: center.id,
    center_name: center.name,
    center_image: center.imageUrl,
    address: center.address,
    latitude: center.latitude.toString(),
    longitude: center.longitude.toString(),
    rating: Number(center.rating),
    review_count: center.reviewCount,
    is_open: isCurrentlyOpen(center.openingTime, center.closingTime),
    opening_time: center.openingTime,
    closing_time: center.closingTime,
    center_type: center.centerType,
    facilities: center.facilities,
    payment_methods: center.paymentMethods,
    website: center.website,
    phone: center.phone,
    email: center.email,
    photos: center.photos,
  };
}
