export interface FranchiseOption {
  id: string;
  name: string;
  city: string;
}

export const FRANCHISES: FranchiseOption[] = [
  { id: "fr-1", name: "Example Diagnostics Lab — Andheri", city: "Mumbai" },
  { id: "fr-2", name: "Example Diagnostics Lab — Bandra", city: "Mumbai" },
  { id: "fr-3", name: "Example Diagnostics Lab — Koramangala", city: "Bengaluru" },
  { id: "fr-4", name: "Example Diagnostics Lab — Indiranagar", city: "Bengaluru" },
  { id: "fr-5", name: "Example Diagnostics Lab — Banjara Hills", city: "Hyderabad" },
  { id: "fr-6", name: "Example Diagnostics Lab — Salt Lake", city: "Kolkata" },
  { id: "fr-7", name: "Example Diagnostics Lab — Anna Nagar", city: "Chennai" },
  { id: "fr-8", name: "Example Diagnostics Lab — Sector 18", city: "Noida" },
];

export const CITIES_STATES: Record<string, string> = {
  Mumbai: "Maharashtra",
  Bengaluru: "Karnataka",
  Hyderabad: "Telangana",
  Kolkata: "West Bengal",
  Chennai: "Tamil Nadu",
  Noida: "Uttar Pradesh",
  Pune: "Maharashtra",
  Ahmedabad: "Gujarat",
};
