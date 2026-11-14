export interface DoctorOption {
  id: string;
  name: string;
  specialization: string;
}

export const DOCTORS: DoctorOption[] = [
  { id: "doc-1", name: "Dr. Sample Doctor 1", specialization: "General Physician" },
  { id: "doc-2", name: "Dr. Sample Doctor 2", specialization: "Endocrinologist" },
  { id: "doc-3", name: "Dr. Sample Doctor 3", specialization: "Cardiologist" },
  { id: "doc-4", name: "Dr. Sample Doctor 4", specialization: "Gynecologist" },
  { id: "doc-5", name: "Dr. Sample Doctor 5", specialization: "Nephrologist" },
  { id: "doc-6", name: "Dr. Sample Doctor 6", specialization: "Pathologist" },
  { id: "doc-7", name: "Dr. Sample Doctor 7", specialization: "Orthopedic" },
  { id: "doc-8", name: "Dr. Sample Doctor 8", specialization: "Pediatrician" },
  { id: "doc-9", name: "Dr. Sample Doctor 9", specialization: "Gastroenterologist" },
  { id: "doc-10", name: "Self Referral", specialization: "—" },
];
