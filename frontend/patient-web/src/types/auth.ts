export interface LoginRequest {
  mobile: string;
}

export interface LoginResult {
  dev_otp?: string;
}

export interface VerifyOtpRequest {
  mobile: string;
  otp: string;
}

export interface VerifyOtpCity {
  id: string;
  name: string;
  slug: string;
}

export interface VerifyOtpUser {
  id: string;
  mobile: string;
  is_profile_complete: boolean;
}

export interface VerifyOtpResult {
  token: string;
  user: VerifyOtpUser;
  cities: VerifyOtpCity[];
}

export type Sex = "Male" | "Female" | "Other";

export interface CompleteProfileRequest {
  name: string;
  sex: Sex;
  d_o_b: string;
  email?: string;
  patient_city?: string;
  profile_photo?: File;
  verification_document?: File;
}

export interface ProfileResult {
  id: string;
  name: string | null;
  mobile: string;
  email: string | null;
  profile_pic: string | null;
  verification_document: string | null;
  d_o_b: string | null;
  age: string | null;
  sex: string | null;
  is_profile_complete: boolean;
  /** The patient's saved city — null until they've picked one. */
  city_id: string | null;
  city_name: string | null;
}
