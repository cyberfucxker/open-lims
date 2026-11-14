export type FamilyMemberRelation =
  "Self" | "Father" | "Mother" | "Spouse" | "Son" | "Daughter" | "Brother" | "Sister" | "Other";

export interface FamilyMemberResult {
  id: string;
  name: string;
  mobile_no: string;
  email: string | null;
  dob: string;
  age: number;
  relation: FamilyMemberRelation;
  gender: string;
  upload_doc: string | null;
  user_id: string;
}

export interface FamilyMemberCity {
  id: string;
  city: string;
  slug: string;
}

export interface FamilyMembersResult {
  family_members: FamilyMemberResult[];
  city: FamilyMemberCity[];
}

export interface AddFamilyMemberRequest {
  name: string;
  /** Optional — falls back server-side to the account holder's own mobile
   *  when omitted. */
  mobile_no?: string;
  email?: string;
  /** Either this or `age` is required — whichever the patient actually
   *  knows/enters. */
  dob?: string;
  age?: number;
  relation: Exclude<FamilyMemberRelation, "Self">;
  gender: "Male" | "Female" | "Other";
}
