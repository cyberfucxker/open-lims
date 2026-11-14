import { FRANCHISES } from "@/data/franchises";
import { DOCTORS } from "@/data/doctors";
import { DEPARTMENTS } from "@/data/departments";
import { MOCK_TESTS } from "@/data/mockTests";
import type { Patient, PatientStatus, PatientType, PaymentStatus, Gender } from "@/types/patient";

const FIRST_NAMES_MALE = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Reyansh",
  "Krishna",
  "Ishaan",
  "Rohan",
  "Kabir",
  "Aryan",
  "Dhruv",
  "Karan",
  "Nikhil",
  "Siddharth",
  "Yash",
];
const FIRST_NAMES_FEMALE = [
  "Saanvi",
  "Aanya",
  "Aadhya",
  "Diya",
  "Ananya",
  "Pari",
  "Ira",
  "Myra",
  "Kavya",
  "Riya",
  "Sneha",
  "Pooja",
  "Neha",
  "Priya",
  "Anjali",
  "Tanvi",
];
const LAST_NAMES = [
  "Sharma",
  "Verma",
  "Gupta",
  "Patel",
  "Iyer",
  "Nair",
  "Reddy",
  "Rao",
  "Kulkarni",
  "Menon",
  "Desai",
  "Joshi",
  "Malhotra",
  "Chatterjee",
  "Bose",
  "Pillai",
];
const CITIES = [
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Kolkata", state: "West Bengal" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Noida", state: "Uttar Pradesh" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Ahmedabad", state: "Gujarat" },
];

const STATUSES: PatientStatus[] = [
  "Registered",
  "Sample Collected",
  "Processing",
  "Completed",
  "Authorized",
];
const PAYMENT_STATUSES: PaymentStatus[] = ["Paid", "Partial", "Pending"];
const PATIENT_TYPES: PatientType[] = ["Retail", "B2B"];

/** Deterministic PRNG so mock data is stable across reloads within a session. */
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20260709);
const pick = <T>(arr: T[]) => arr[Math.floor(random() * arr.length)];
const pickCount = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;

function generatePatient(index: number): Patient {
  const gender: Gender = random() > 0.5 ? "Male" : "Female";
  const firstName = gender === "Male" ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
  const lastName = pick(LAST_NAMES);
  const age = pickCount(4, 78);
  const location = pick(CITIES);
  const doctor = pick(DOCTORS);
  const franchise = pick(FRANCHISES);
  const department = pick([...DEPARTMENTS]);
  const status = pick(STATUSES);
  const paymentStatus = pick(PAYMENT_STATUSES);
  const patientType = pick(PATIENT_TYPES);

  const testCount = pickCount(1, 4);
  const tests = Array.from({ length: testCount }, () => pick(MOCK_TESTS)).filter(
    (test, i, arr) => arr.findIndex((t) => t.id === test.id) === i,
  );
  const totalAmount = tests.reduce((sum, t) => sum + t.price, 0);
  const paidAmount =
    paymentStatus === "Paid"
      ? totalAmount
      : paymentStatus === "Partial"
        ? Math.round(totalAmount * 0.5)
        : 0;

  const daysAgo = pickCount(0, 45);
  const registrationDate = new Date();
  registrationDate.setDate(registrationDate.getDate() - daysAgo);

  const dob = new Date();
  dob.setFullYear(dob.getFullYear() - age, pickCount(0, 11), pickCount(1, 28));

  const patientId = `LAB${String(24000 + index).padStart(6, "0")}`;

  return {
    id: `pat-${index}`,
    patientId,
    title: gender === "Male" ? "Mr." : "Ms.",
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    gender,
    age,
    dob: dob.toISOString().slice(0, 10),
    mobile: `9${pickCount(100000000, 999999999)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    addressLine: `${pickCount(1, 400)}, ${pick(["MG Road", "Park Street", "Church Street", "Ring Road", "Lake View"])}`,
    city: location.city,
    state: location.state,
    pincode: String(pickCount(400001, 700099)),
    doctor: doctor.name,
    department,
    franchise: franchise.name,
    patientType,
    status,
    paymentStatus,
    registrationDate: registrationDate.toISOString().slice(0, 10),
    collectionType: random() > 0.5 ? "Lab Visit" : "Home Collection",
    tests: tests.map((t) => ({ testId: t.id, name: t.name, price: t.price })),
    totalAmount,
    paidAmount,
    dueAmount: totalAmount - paidAmount,
  };
}

export const MOCK_PATIENTS: Patient[] = Array.from({ length: 68 }, (_, i) =>
  generatePatient(i + 1),
).sort((a, b) => (a.registrationDate < b.registrationDate ? 1 : -1));
