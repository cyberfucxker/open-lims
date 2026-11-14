export interface ServiceCenterDto {
  id: string;
  name: string;
  imageUrl: string | null;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  openingTime: string | null;
  closingTime: string | null;
  centerType: string | null;
  isActive: boolean;
  facilities: string[];
  paymentMethods: string[];
  photos: string[];
  /** The franchise this lab card is assigned to — null if none. */
  organizationId: string | null;
  organizationName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCenterWriteData {
  name: string;
  imageUrl?: string | null;
  address: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  latitude: number;
  longitude: number;
  /** 0–5, one decimal (`Decimal(2,1)`). Admin-entered: there's no patient
   *  review table to average, so the "4.6 (128 reviews)" a patient sees on
   *  the nearest-lab card is whatever the CMS was told — see
   *  `nearbyLabs.service.ts#getCenterDetail`. Omit on write to leave the
   *  stored value untouched on create (defaults to 0). */
  rating?: number;
  /** The count shown beside `rating`. Same reasoning: admin-entered, since
   *  nothing computes it. */
  reviewCount?: number;
  openingTime?: string | null;
  closingTime?: string | null;
  centerType?: string | null;
  isActive?: boolean;
  facilities?: string[];
  paymentMethods?: string[];
  photos?: string[];
  /** The franchise this lab card is assigned to — omit to leave unset on
   *  create, pass `null` to clear it on update. */
  organizationId?: string | null;
}

export interface ListServiceCentersParams {
  search?: string;
  isActive?: string;
  page?: number;
  pageSize?: number;
}

export interface ListServiceCentersResult {
  rows: ServiceCenterDto[];
  total: number;
}
