export type AppOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ACCEPTED"
  | "STARTED_JOURNEY"
  | "REJECTED"
  | "REACHED"
  | "SAMPLE_COLLECTED"
  | "SAMPLE_DROPPED"
  | "COMPLETED"
  | "CANCELLED";

/** Human labels are what every app-facing endpoint actually returns (order.service.ts
 *  ORDER_STATUS_LABEL) — never the raw enum. Keep this map as the single source of truth
 *  for both mocks and Phase-2 display so status text never drifts from backend copy. */
export const ORDER_STATUS_LABEL: Record<AppOrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  ACCEPTED: "Phlebotomist Assigned",
  STARTED_JOURNEY: "Phlebotomist On The Way",
  REACHED: "Reached",
  SAMPLE_COLLECTED: "Sample Collected",
  SAMPLE_DROPPED: "Sample Dropped At Lab",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_TIMELINE: AppOrderStatus[] = [
  "CONFIRMED",
  "ACCEPTED",
  "STARTED_JOURNEY",
  "REACHED",
  "SAMPLE_COLLECTED",
  "SAMPLE_DROPPED",
  "COMPLETED",
];

export interface ReviewCartRequest {
  address_id: string;
  slot_id: string;
  date: string;
}

export interface ReviewCartFamilyMemberItem {
  name: string;
  price: number;
}

export interface ReviewCartFamilyMember {
  member_id: string;
  name: string;
  relation: string;
  gender: string;
  age: number;
  dob: string;
  items: ReviewCartFamilyMemberItem[];
}

/** type: 1 = test, 2 = package here — the OPPOSITE of Add-to-Cart's "1"=package/"3"=test. */
export interface ReviewCartItem {
  cart_id: string;
  family_member_id: string;
  family_member_name: string;
  type: 1 | 2;
  type_label: "Test" | "Package";
  type_id: string;
  name: string;
  mrp: number;
  price: number;
}

export interface ReviewCartCoupon {
  applied: boolean;
  coupon_id: string;
  coupon_code: string;
  coupon_discount: number;
}

export interface ReviewCartPaymentSummary {
  subtotal: number;
  phlebotomy_charges: number;
  wallet_discount: number;
  coupon_discount: number;
  total_payable: number;
}

export interface ReviewCartResult {
  order_id: string;
  order_number: string;
  order_status: AppOrderStatus;
  family_members: ReviewCartFamilyMember[];
  cart_items: ReviewCartItem[];
  sample_collection: {
    date: string;
    slot_id: string;
    slot: string;
    address: Record<string, unknown>;
  };
  coupon: ReviewCartCoupon | null;
  payment_summary: ReviewCartPaymentSummary;
}

export type AppPaymentMode = "cash" | "online";

export interface ConfirmOrderRequest {
  order_id: string;
  payment_type: AppPaymentMode;
}

export interface ConfirmOrderResult {
  order_number: string;
  order_status: AppOrderStatus;
  service_pin: string | null;
  total_payable: number;
}

export type OrdersFilter = "all" | "upcoming" | "past";

export type AppOrderType = "CATALOG" | "HOME_VISIT";

export interface OrderListItem {
  id: string;
  orderNo: string;
  orderType: AppOrderType;
  patientName: string;
  age: number;
  gender: string;
  bookingDate: string;
  timeSlot: string | null;
  orderStatus: string;
  paymentMode: "Cash" | "Online";
  bookingAmount: number;
  servicePin: string | null;
  reportUrl: null;
}

export interface OrderDetailPatient {
  name: string;
  age: number;
  gender: string;
  mobile: string;
}

export interface OrderDetailPayment {
  paymentMode: "Cash" | "Online";
  paymentStatus: "Paid" | "Partial" | "Pending";
  amount: number;
}

export interface OrderDetailAddress {
  address_id: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderDetailPhlebotomist {
  id: string;
  name: string;
  mobile: string;
  photoUrl: string | null;
}

export interface OrderDetailItem {
  id: string;
  name: string;
  type: "Test" | "Package";
  price: number;
}

export interface OrderDetail {
  id: string;
  orderNo: string;
  orderType: AppOrderType;
  /** Only set on a HOME_VISIT order — the complaint described at booking. */
  symptomNotes: string | null;
  /** Only set on a HOME_VISIT order, and only until `items` is populated —
   *  who the visit is booked for, before the phlebo has added tests. */
  homeVisitPatient: { name: string; relation: string } | null;
  patients: OrderDetailPatient[];
  bookingDate: string;
  timeSlot: string | null;
  orderStatus: string;
  payment: OrderDetailPayment;
  address: OrderDetailAddress | null;
  phlebotomist: OrderDetailPhlebotomist | null;
  servicePin: string | null;
  items: OrderDetailItem[];
  reportUrl: null;
}

export interface CreateHomeVisitRequest {
  family_member_id: string;
  address_id: string;
  slot_id: string;
  date: string;
  symptom_notes: string;
  /** Set when booked via "Book Now" on a specific "Nearest Lab" card — routes
   *  this booking to that lab's franchise dashboard. */
  service_center_id?: string;
}

export interface CreateHomeVisitResult {
  order_id: string;
  order_number: string;
  order_status: string;
  service_pin: string;
  total_payable: number;
}

export interface CancelOrderRequest {
  reason: string;
}
