export interface City {
  id: string;
  name: string;
  slug: string;
  state_id: string;
  /** So a City dropdown (the Address form) can show/derive the state
   *  without a second lookup. */
  state_name: string;
  /** City-center point, not any specific lab's address — fallback origin for
   *  "Nearest Lab" distance-sort when device geolocation isn't available.
   *  Null if this city has no fallback point set. */
  latitude: number | null;
  longitude: number | null;
}
