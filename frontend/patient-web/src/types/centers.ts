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
  facilities: string[];
  payment_methods: string[];
  website: string | null;
  phone: string | null;
  email: string | null;
  photos: string[];
}
