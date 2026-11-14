import { FRANCHISES } from "@/data/franchises";
import { MOCK_PATIENTS } from "@/data/mockPatients";
import { MOCK_TESTS } from "@/data/mockTests";
import { delay } from "@/services/mock/delay";
import type {
  ListPatientsParams,
  ListPatientsResult,
  Patient,
  PatientFormValues,
} from "@/types/patient";

let patients: Patient[] = [...MOCK_PATIENTS];

export async function listPatients(params: ListPatientsParams = {}): Promise<ListPatientsResult> {
  await delay();
  const {
    query,
    patientId,
    mobile,
    dateFrom,
    dateTo,
    doctor,
    franchise,
    department,
    status,
    patientType,
    page = 1,
    pageSize = 10,
    sortBy = "registrationDate",
    sortDir = "desc",
  } = params;

  let filtered = [...patients];

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.patientId.toLowerCase().includes(q) ||
        p.mobile.includes(q),
    );
  }
  if (patientId)
    filtered = filtered.filter((p) => p.patientId.toLowerCase().includes(patientId.toLowerCase()));
  if (mobile) filtered = filtered.filter((p) => p.mobile.includes(mobile));
  if (dateFrom) filtered = filtered.filter((p) => p.registrationDate >= dateFrom);
  if (dateTo) filtered = filtered.filter((p) => p.registrationDate <= dateTo);
  if (doctor && doctor !== "all") filtered = filtered.filter((p) => p.doctor === doctor);
  if (franchise && franchise !== "all")
    filtered = filtered.filter((p) => p.franchise === franchise);
  if (department && department !== "all")
    filtered = filtered.filter((p) => p.department === department);
  if (status && status !== "all") filtered = filtered.filter((p) => p.status === status);
  if (patientType && patientType !== "all")
    filtered = filtered.filter((p) => p.patientType === patientType);

  filtered.sort((a, b) => {
    const av = a[sortBy as keyof Patient];
    const bv = b[sortBy as keyof Patient];
    if (av == null || bv == null) return 0;
    const cmp = av > bv ? 1 : av < bv ? -1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  return { rows, total };
}

export async function getPatient(id: string): Promise<Patient | undefined> {
  await delay(250);
  return patients.find((p) => p.id === id);
}

export async function createPatient(
  values: PatientFormValues,
  selectedTestIds: string[],
): Promise<Patient> {
  await delay(900);

  const selectedTests = MOCK_TESTS.filter((t) => selectedTestIds.includes(t.id));
  const subtotal = selectedTests.reduce((sum, t) => sum + t.price, 0);
  const discount = Math.round((subtotal * (values.discountPercent || 0)) / 100);
  const totalAmount = subtotal - discount;

  const dob = new Date(values.dob);
  const age = Math.max(0, new Date().getFullYear() - dob.getFullYear());

  const nameParts = values.fullName.trim().split(/\s+/);
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  const newPatient: Patient = {
    id: `pat-new-${Date.now()}`,
    patientId: `LAB${String(Math.floor(30000 + Math.random() * 9000))}`,
    title: values.title,
    firstName,
    lastName,
    fullName: values.fullName,
    gender: values.gender,
    age,
    dob: values.dob,
    mobile: values.mobile ?? "",
    email: values.email,
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    doctor: values.referral || "—",
    department: "General",
    franchise: FRANCHISES[0].name,
    patientType: values.patientType,
    status: "Registered",
    paymentStatus:
      values.amountPaid >= totalAmount ? "Paid" : values.amountPaid > 0 ? "Partial" : "Pending",
    registrationDate: new Date().toISOString().slice(0, 10),
    collectionType: "Lab Visit",
    tests: selectedTests.map((t) => ({ testId: t.id, name: t.name, price: t.price })),
    totalAmount,
    paidAmount: values.amountPaid,
    dueAmount: Math.max(0, totalAmount - values.amountPaid),
  };

  patients = [newPatient, ...patients];
  return newPatient;
}
