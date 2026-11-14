import { MOCK_ADDRESSES } from "./data/addresses";
import { MOCK_ORDERS, MOCK_ORDER_DETAILS } from "./data/orders";
import { MOCK_WALLET_BALANCE, MOCK_WALLET_TRANSACTIONS } from "./data/wallet";
import type {
  AddressResult,
  FamilyMemberResult,
  OrderDetail,
  OrderListItem,
  PrescriptionItem,
  Sex,
  WalletTransaction,
} from "@/types";

export type MockCartItemType = "TEST" | "PACKAGE";

export interface MockCartItem {
  id: string;
  itemType: MockCartItemType;
  itemId: string;
  familyMemberId: string;
}

export interface MockCoupon {
  couponCode: string;
  discountAmount: number;
}

/** Single mutable in-memory "database" backing every mock API module, so state added on
 *  one screen (e.g. add-to-cart from Catalog) is visible on another (Cart badge, Cart page)
 *  without wiring a real backend. Mirrors what the real API's DB row state would hold. */
export const mockDb = {
  isAuthenticated: false,
  authToken: null as string | null,
  pendingMobile: null as string | null,
  user: {
    id: "user_1",
    mobile: "9876543210",
    is_profile_complete: true,
    name: "Demo Patient",
    email: "demo.patient@example.com",
    sex: "Male" as Sex,
    dob: "1994-02-15",
    profile_pic: null as string | null,
  },
  familyMembers: [
    {
      id: "fm_self",
      name: "Demo Patient",
      mobile_no: "9876543210",
      email: "demo.patient@example.com",
      dob: "15-02-1994",
      age: 32,
      relation: "Self",
      gender: "Male",
      upload_doc: null,
      user_id: "user_1",
    },
    {
      id: "fm_mother",
      name: "Demo Relative",
      mobile_no: "9876543211",
      email: null,
      dob: "10-04-1968",
      age: 58,
      relation: "Mother",
      gender: "Female",
      upload_doc: null,
      user_id: "user_1",
    },
  ] as FamilyMemberResult[],
  addresses: [...MOCK_ADDRESSES] as AddressResult[],
  cartItems: [] as MockCartItem[],
  appliedCoupon: null as MockCoupon | null,
  walletBalance: MOCK_WALLET_BALANCE,
  walletTransactions: [...MOCK_WALLET_TRANSACTIONS] as WalletTransaction[],
  orders: [...MOCK_ORDERS] as OrderListItem[],
  orderDetails: { ...MOCK_ORDER_DETAILS } as Record<string, OrderDetail>,
  prescriptions: [] as PrescriptionItem[],
  draftOrder: null as null | {
    order_id: string;
    order_number: string;
    address_id: string;
    slot_id: string;
    slotTitle: string;
    date: string;
  },
};

export function resetMockDb() {
  mockDb.isAuthenticated = false;
  mockDb.authToken = null;
  mockDb.pendingMobile = null;
  mockDb.cartItems = [];
  mockDb.appliedCoupon = null;
  mockDb.draftOrder = null;
}
