import type { AppOrderStatus, AppOrderType, AppPaymentMode } from "@prisma/client";
import type { PaymentStatus } from "./appointment.types";

export const APP_ORDER_STATUS_VALUES: AppOrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ACCEPTED",
  "STARTED_JOURNEY",
  "REACHED",
  "SAMPLE_COLLECTED",
  "SAMPLE_DROPPED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

export const APP_ORDER_PAYMENT_MODE_VALUES: AppPaymentMode[] = ["CASH", "ONLINE"];

export const APP_ORDER_PAYMENT_STATUS_VALUES: PaymentStatus[] = ["PAID", "PARTIAL", "PENDING"];

export interface AppOrderPhlebotomistSummary {
  id: string;
  name: string;
}

export interface AppOrderListItem {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerMobile: string;
  city: string | null;
  itemSummary: string;
  phlebotomist: AppOrderPhlebotomistSummary | null;
  slotLabel: string | null;
  /** Device that confirmed this booking — "WEB" when unknown (pre-migration
   *  orders, or a genuine web checkout). */
  platform: "ANDROID" | "IOS" | "WEB" | "WHATSAPP";
  orderType: AppOrderType;
  status: AppOrderStatus;
  totalPayable: number;
  paymentMode: AppPaymentMode | null;
  paymentStatus: PaymentStatus | null;
  orderDate: string;
  createdAt: string;
}

export interface ListAppOrdersParams {
  search?: string;
  status?: AppOrderStatus;
  /** Franchise scope — set server-side from the session, never parsed from the
   *  query string. */
  organizationId?: string;
  /** A literal `"unassigned"` means "phleboId IS NULL", any other value is
   *  matched against `Phlebotomist.id`. */
  phleboId?: string;
  paymentMode?: AppPaymentMode;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ListAppOrdersResult {
  rows: AppOrderListItem[];
  total: number;
}

export interface AppOrderAddressDto {
  id: string;
  type: string;
  houseNo: string | null;
  apartment: string | null;
  address: string;
  locality: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

export interface AppOrderSlotDto {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
}

/** Same shape api.md's Get Order Detail already contracts for the patient
 *  app's `phlebotomist` object — minus `eta`, which is an app-side ETA
 *  calculation concern, not admin's. */
export interface AppOrderPhlebotomistDto {
  id: string;
  name: string;
  mobile: string;
  photoUrl: string | null;
}

export interface AppOrderItemDto {
  id: string;
  name: string;
  type: "Test" | "Package";
  price: number;
  /** Who this line is for. One order can cover several family members — the
   *  account holder in `customer` is who BOOKED it, not necessarily whose
   *  sample gets drawn — so ops needs this per item to know what to collect
   *  from whom. */
  familyMemberId: string;
  patientName: string;
  relation: string;
}

/** Everyone whose sample this order covers, de-duplicated — one entry per
 *  member, each already backed by its own Appointment and Bill. */
export interface AppOrderPatientDto {
  familyMemberId: string;
  name: string;
  relation: string;
  age: number;
  gender: string;
  mobile: string;
}

export interface AppOrderTimelineEventDto {
  label: string;
  at: string;
}

export interface AppOrderDetailDto {
  id: string;
  orderNumber: string;
  customer: { id: string; name: string | null; mobile: string; email: string | null };
  address: AppOrderAddressDto | null;
  slot: AppOrderSlotDto | null;
  phlebotomist: AppOrderPhlebotomistDto | null;
  status: AppOrderStatus;
  orderType: AppOrderType;
  /** Only set on a HOME_VISIT order — the complaint the patient described at
   *  booking time, for the phlebo to read before deciding what to test. */
  symptomNotes: string | null;
  /** Only set on a HOME_VISIT order, and only until the phlebo adds tests
   *  (once `items`/`patients` exist, this is redundant with them and stays
   *  populated but unused by the UI). */
  homeVisitFamilyMember: { familyMemberId: string; name: string; relation: string } | null;
  paymentMode: AppPaymentMode | null;
  paymentStatus: PaymentStatus | null;
  servicePin: string | null;
  patients: AppOrderPatientDto[];
  subtotal: number;
  phlebotomyCharges: number;
  walletDiscount: number;
  couponDiscount: number;
  totalPayable: number;
  items: AppOrderItemDto[];
  timeline: AppOrderTimelineEventDto[];
  createdAt: string;
}

export interface UpdateAppOrderStatusInput {
  status: AppOrderStatus;
}

export interface AssignPhleboInput {
  phleboId: string | null;
}

/** A brand-new customer entered inline on the Create Order form, for a
 *  walk-in patient who has no app account yet — creates the `AppUser` +
 *  a `SELF` `FamilyMember`/`Patient` + one `Address`, all in the same
 *  transaction as the order itself, rather than requiring the caller to
 *  provision an account some other way first. Mutually exclusive with
 *  `CreateAppOrderInput.appUserId` — exactly one of the two must be set. */
export interface CreateAppOrderNewCustomerInput {
  name: string;
  mobile: string;
  gender: "Male" | "Female" | "Other";
  /** ISO `yyyy-mm-dd` — either this or `age` is required. */
  dob?: string;
  age?: number;
  email?: string;
  address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    /** Lets the order resolve a real Area/slot-capacity immediately rather
     *  than landing as "service not available" until the customer later
     *  edits their address from the app — the franchise creating this
     *  order already knows which of its own areas the patient is in. */
    areaId?: string;
    /** Defaults to `mobile` when omitted — same convention as a family
     *  member with no phone of their own (see `addFamilyMember`). */
    phone?: string;
  };
}

export interface CreateAppOrderInput {
  /** Set for an existing, already-registered customer. Exactly one of this
   *  or `newCustomer` must be set. */
  appUserId?: string;
  /** Set to create a new walk-in customer alongside the order — see
   *  `CreateAppOrderNewCustomerInput`'s doc-comment. */
  newCustomer?: CreateAppOrderNewCustomerInput;
  /** Only meaningful with `appUserId` — an existing customer's own family
   *  member. A `newCustomer` is always booked for themself. */
  familyMemberId?: string;
  /** Only meaningful with `appUserId` — a `newCustomer`'s address is
   *  created fresh from `newCustomer.address` instead. */
  addressId?: string;
  slotId?: string;
  orderDate: string;
  testIds: string[];
  packageIds?: string[];
  paymentMode: AppPaymentMode;
  /** Stamped on the created order when a franchise is the one creating it
   *  — see `franchiseOrderScope.ts`. Never set by the admin path. */
  organizationId?: string;
}

/** Input to `addHomeVisitItems` — either the phlebo's or an admin's "here's
 *  what I'm actually testing for" call against a HOME_VISIT order that was
 *  booked with a symptom but no tests. Callable repeatedly by either side as
 *  more is added; only newly-selected tests/packages get billed each time. */
export interface AddHomeVisitItemsInput {
  testIds: string[];
  packageIds?: string[];
}
