import type { CenterDetail, CenterListItem } from "@/types";

export const MOCK_CENTERS: CenterListItem[] = [
  {
    id: "center_1",
    center_name: "Example Diagnostics Lab - Central",
    address: "1st Floor, Example Plaza, Sample Nagar, Sample City",
    phone: "+91 90000 00000",
    distance: 1.8,
    lat: "26.9124",
    long: "75.7873",
    is_open: true,
  },
  {
    id: "center_2",
    center_name: "Example Diagnostics Lab - North",
    address: "Near Example Tower, Sample Colony, Sample City",
    phone: "+91 90000 00000",
    distance: 4.2,
    lat: "26.8535",
    long: "75.8038",
    is_open: true,
  },
  {
    id: "center_3",
    center_name: "Example Diagnostics Lab - East",
    address: "Main Road, Demo Nagar, Sample City",
    phone: "+91 90000 00000",
    distance: 6.5,
    lat: "26.9127",
    long: "75.7462",
    is_open: false,
  },
];

export const MOCK_CENTER_DETAILS: Record<string, CenterDetail> = Object.fromEntries(
  MOCK_CENTERS.map((c) => [
    c.id,
    {
      id: c.id,
      center_name: c.center_name,
      center_image: null,
      address: c.address,
      latitude: c.lat,
      longitude: c.long,
      rating: 4.6,
      review_count: 812,
      is_open: c.is_open,
      opening_time: "07:00",
      closing_time: "20:00",
      center_type: "Collection Centre",
      facilities: ["Parking", "Wheelchair Access", "AC Waiting Area"],
      payment_methods: ["Cash", "Card", "UPI"],
      website: "https://example.com",
      phone: c.phone,
      email: "info@example.com",
      photos: [],
    } satisfies CenterDetail,
  ]),
);
