import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  ClipboardList,
  Download,
  FileText,
  Home as HomeIcon,
  MapPin,
  Microscope,
  ShieldCheck,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { patientAvatar } from "@/assets/stock";

/** Static/UI-only content for the marketing home page — not sourced from
 *  any API. Replace with real CMS data once the home-page content API lands. */

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  to?: string;
  hash?: string;
  /** No dedicated screen yet — shows a "coming soon" toast instead of navigating. */
  comingSoon?: boolean;
  gradient: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "home-collection",
    label: "Book Home Collection",
    icon: HomeIcon,
    to: "/tests",
    gradient: "from-primary to-[oklch(0.5_0.22_20)]",
  },
  {
    id: "lab-visit",
    label: "Book Home Visit",
    icon: Building2,
    to: "/book-home-visit",
    gradient: "from-brand-teal to-[oklch(0.45_0.13_192)]",
  },
  {
    id: "nearest-lab",
    label: "Nearest Lab",
    icon: MapPin,
    to: "/nearby-labs",
    gradient: "from-brand-violet to-[oklch(0.42_0.22_300)]",
  },
  {
    id: "reports",
    label: "My Reports",
    icon: FileText,
    to: "/reports",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "orders",
    label: "My Orders",
    icon: ClipboardList,
    to: "/orders",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "prescription",
    label: "Upload Prescription",
    icon: Upload,
    to: "/prescriptions",
    gradient: "from-sky-500 to-blue-600",
  },
];

export interface HowItWorksStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    id: "step-book",
    title: "Book your test online",
    description:
      "Choose a test or package, pick a convenient time slot — all in under two minutes.",
    icon: CalendarCheck,
  },
  {
    id: "step-collect",
    title: "Free home sample collection",
    description: "A certified phlebotomist visits your home with a fully sanitized collection kit.",
    icon: HomeIcon,
  },
  {
    id: "step-lab",
    title: "Tested at our certified lab",
    description: "Your sample is processed under strict quality checks by expert pathologists.",
    icon: Microscope,
  },
  {
    id: "step-report",
    title: "Download your report online",
    description: "Get a secure, verified digital report on your phone as soon as it's ready.",
    icon: Download,
  },
];

export interface TrustBadge {
  id: string;
  label: string;
  value: string;
  icon: LucideIcon;
}

export const TRUST_BADGES: TrustBadge[] = [
  { id: "accredited", label: "Accredited Labs", value: "100%", icon: ShieldCheck },
  { id: "patients", label: "Happy Patients", value: "2 Lakh+", icon: Users },
  { id: "cities", label: "Cities Covered", value: "60+", icon: HomeIcon },
  { id: "ontime", label: "On-Time Reports", value: "99.2%", icon: BadgeCheck },
];

export interface PatientReview {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  avatar: string;
  packageTaken: string;
}

export const PATIENT_REVIEWS: PatientReview[] = [
  {
    id: "rev-1",
    name: "Sample Patient 1",
    location: "Sample City, State",
    rating: 5,
    text: "The phlebotomist arrived right on time and was extremely gentle. Got my full body report the very next evening — super smooth experience.",
    avatar: patientAvatar(47),
    packageTaken: "Full Body Checkup - Advanced",
  },
  {
    id: "rev-2",
    name: "Sample Patient 2",
    location: "Sample City, State",
    rating: 5,
    text: "Booking took less than a minute and the home collection was completely hassle-free. Highly recommend for anyone with a busy schedule.",
    avatar: patientAvatar(12),
    packageTaken: "Diabetes Care Package",
  },
  {
    id: "rev-3",
    name: "Sample Patient 3",
    location: "Sample City, State",
    rating: 4,
    text: "Loved how easy it was to download my mother's report online and share it directly with her doctor. Very transparent pricing too.",
    avatar: patientAvatar(45),
    packageTaken: "Senior Citizen Package",
  },
  {
    id: "rev-4",
    name: "Sample Patient 4",
    location: "Sample City, State",
    rating: 5,
    text: "Clean kits, well-trained staff, and accurate reports. This is now the only lab I trust for my family's routine checkups.",
    avatar: patientAvatar(33),
    packageTaken: "Heart Health Package",
  },
  {
    id: "rev-5",
    name: "Sample Patient 5",
    location: "Sample City, State",
    rating: 5,
    text: "The app made it so simple to track my order status and get notified the moment my report was ready. Excellent service.",
    avatar: patientAvatar(29),
    packageTaken: "Women's Wellness Package",
  },
  {
    id: "rev-6",
    name: "Sample Patient 6",
    location: "Sample City, State",
    rating: 4,
    text: "Fast, affordable and dependable. The offers made my full body test even more worth it.",
    avatar: patientAvatar(53),
    packageTaken: "Fever & Infection Panel",
  },
];

export interface DoctorReview {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  text: string;
  avatar: string;
}

/** Referring/partner doctors — a separate carousel row from `PATIENT_REVIEWS`
 *  on the home page, speaking to report accuracy and turnaround rather than
 *  the booking experience. */
export const DOCTOR_REVIEWS: DoctorReview[] = [
  {
    id: "doc-1",
    name: "Dr. Sample Doctor 1",
    specialty: "General Physician, Sample City",
    rating: 5,
    text: "I refer my patients to this lab for routine and specialised panels alike — the turnaround is consistent and the reports are clinically dependable.",
    avatar: patientAvatar(65),
  },
  {
    id: "doc-2",
    name: "Dr. Sample Doctor 2",
    specialty: "Cardiologist, Sample City",
    rating: 5,
    text: "Their cardiac marker panels come back fast with clear reference ranges — that reliability matters when I'm making same-day treatment calls.",
    avatar: patientAvatar(58),
  },
  {
    id: "doc-3",
    name: "Dr. Sample Doctor 3",
    specialty: "Gynaecologist, Sample City",
    rating: 4,
    text: "Home collection means my antenatal patients don't have to travel for routine screening. Quality has stayed consistent across every batch.",
    avatar: patientAvatar(44),
  },
  {
    id: "doc-4",
    name: "Dr. Sample Doctor 4",
    specialty: "Endocrinologist, Sample City",
    rating: 5,
    text: "Thyroid and HbA1c results are accurate and well-flagged against critical values, which speeds up how quickly I can act on them.",
    avatar: patientAvatar(71),
  },
];

export interface FooterLinkGroup {
  title: string;
  links: Array<{ label: string; to: string }>;
}

export const FOOTER_QUICK_LINKS: FooterLinkGroup = {
  title: "Quick Links",
  links: [
    { label: "Home", to: "/" },
    { label: "Tests & Packages", to: "/tests" },
    { label: "My Bookings", to: "/orders" },
    { label: "Upload Prescription", to: "/prescriptions" },
    { label: "My Profile", to: "/profile" },
  ],
};

export const FOOTER_PACKAGE_LINKS: FooterLinkGroup = {
  title: "Tests & Packages",
  links: [
    { label: "Full Body Checkup", to: "/packages/pkg_full_body" },
    { label: "Diabetes Care Package", to: "/packages/pkg_diabetes" },
    { label: "Heart Health Package", to: "/packages/pkg_heart" },
    { label: "Women's Wellness Package", to: "/packages/pkg_women" },
    { label: "Senior Citizen Package", to: "/packages/pkg_senior" },
  ],
};

/** Legal pages are reproduced in-app (see `pages/company/*Page.tsx`) rather
 *  than linked out to example.com, so these are in-app routes, not the
 *  external `MOCK_CONFIG.cms_links` URLs. */
export const FOOTER_LEGAL_LINKS: Array<{ label: string; to: string }> = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Refund Policy", to: "/refund-policy" },
  { label: "Franchise", to: "/franchise" },
];

/** Cities/towns currently served — shown in the "Our Presence" section. */
export const OUR_PRESENCE_CITIES: string[] = [
  "Agra",
  "Ajmer",
  "Alwar",
  "Auraiya",
  "Bahadurgarh",
  "Bandikui",
  "Baran",
  "Bayana",
  "Bharatpur",
  "Bhilwara",
  "Bijainagar",
  "Bikaner",
  "Chittorgarh",
  "Datia",
  "Dausa",
  "Deeg",
  "Dholpur",
  "Gangapur City",
  "Guna",
  "Gwalior",
  "Hindaun City",
  "Jaipur",
  "Jhalawar",
  "Jhunjhunu",
  "Jodhpur",
  "Khagaria",
  "Khairtal",
  "Kota",
  "Kotkapura",
  "Kotputli",
  "Kurukshetra",
  "Morena",
  "Narnaul",
  "Neem Ka Thana",
  "Patna",
  "Ratangarh",
  "Ringus",
  "Saharsa",
  "Sikar",
  "Sri Ganganagar",
  "Saharanpur",
  "Srinagar",
  "Tara Nagar",
  "Tonk",
  "Udaipur",
  "Rourkela",
  "Sitapur",
  "Ghaziabad",
  "Ranchi",
  "Chandigarh",
  "Raipur",
  "Nerchowk Mandi",
  "Sirsa",
  "Ludhiana",
  "Moga",
  "Bhavnagar",
  "Delhi",
  "Meerut",
  "Bhopal",
  "Indore",
];

export const SOCIAL_LINKS = [
  { id: "facebook", label: "Facebook", href: "https://facebook.com" },
  { id: "instagram", label: "Instagram", href: "https://instagram.com" },
  { id: "twitter", label: "Twitter", href: "https://twitter.com" },
  { id: "youtube", label: "YouTube", href: "https://youtube.com" },
  { id: "linkedin", label: "LinkedIn", href: "https://linkedin.com" },
];
