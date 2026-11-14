/** Launch catalogue for the rebuilt Test / Parameter / Package module, seeded
 *  (idempotently) by `prisma/seed.ts`.
 *
 *  Layered bottom-up, because each layer resolves the one below it by name:
 *  departments+categories and sample types -> parameters -> tests (which attach
 *  parameters by short name) -> packages (which attach tests and standalone
 *  parameters by short name). Short names are the seed's join key for exactly
 *  the reason the API accepts them: they're human-writable. They are resolved
 *  to ids once at seed time and never matched again afterwards.
 *
 *  Every short name here is unique within its own table, which the DB now
 *  enforces — the pre-rebuild catalogue had two different tests both claiming
 *  "CBC", and this file is the reference for what a clean one looks like. */

export interface DepartmentSeed {
  name: string;
  code: string;
  description: string;
  /** Categories are department-scoped (a Category FKs to exactly one). */
  categories: { name: string; code: string }[];
}

export const DEPARTMENT_SEEDS: DepartmentSeed[] = [
  {
    name: "Biochemistry",
    code: "BIO",
    description: "Serum and plasma chemistry — organ panels, metabolites, hormones.",
    categories: [
      { name: "Liver Function", code: "LFT" },
      { name: "Kidney Function", code: "KFT" },
      { name: "Lipid Profile", code: "LIPID" },
      { name: "Diabetes", code: "DIAB" },
      { name: "Thyroid", code: "THY" },
      { name: "Vitamins", code: "VIT" },
      { name: "Electrolytes", code: "ELEC" },
    ],
  },
  {
    name: "Hematology",
    code: "HEM",
    description: "Whole-blood cell counts, morphology, and sedimentation.",
    categories: [
      { name: "Complete Blood Count", code: "CBC" },
      { name: "Coagulation", code: "COAG" },
    ],
  },
  {
    name: "Serology",
    code: "SERO",
    description: "Antibody and antigen detection for infectious disease.",
    categories: [{ name: "Infectious Disease", code: "INFD" }],
  },
  {
    name: "Clinical Pathology",
    code: "CPATH",
    description: "Routine urine, stool, and parasite examination.",
    categories: [
      { name: "Urine Analysis", code: "URINE" },
      { name: "Parasitology", code: "PARA" },
    ],
  },
  {
    name: "Microbiology",
    code: "MICRO",
    description: "Culture, sensitivity, and organism identification.",
    categories: [{ name: "Culture & Sensitivity", code: "CULT" }],
  },
];

export interface SampleTypeSeed {
  name: string;
  description: string;
  /** Barcode prefix for `SampleTypeBarcodeConfig`. Without a config row, sample
   *  collection for tests of this type fails at `idGenerator.ts#nextSampleNo`,
   *  so every seeded sample type gets one. */
  barcodePrefix: string;
}

/** The lab's actual specimen list. Kept in step with what's configured in the
 *  Superadmin Sample Types tab — if the two drift, re-running the seed silently
 *  reintroduces retired specimen types alongside the real ones. */
export const SAMPLE_TYPE_SEEDS: SampleTypeSeed[] = [
  { name: "Blood", description: "Whole blood collected by venipuncture.", barcodePrefix: "BLO" },
  {
    name: "Urine",
    description: "Random, midstream, or timed urine collection.",
    barcodePrefix: "URN",
  },
  {
    name: "Body Fluids",
    description: "Pleural, peritoneal, pericardial, or synovial fluid.",
    barcodePrefix: "BDF",
  },
  { name: "Aspirates", description: "Fine-needle or cavity aspirate.", barcodePrefix: "ASP" },
  {
    name: "Stool",
    description: "Faecal sample for routine or culture examination.",
    barcodePrefix: "STL",
  },
  { name: "Sputum", description: "Deep-cough expectorated sputum.", barcodePrefix: "SPU" },
  {
    name: "Tissue",
    description: "Biopsy or resected tissue for histopathology.",
    barcodePrefix: "TIS",
  },
  {
    name: "Pus",
    description: "Pus or wound swab for culture and sensitivity.",
    barcodePrefix: "PUS",
  },
  {
    name: "Nail",
    description: "Nail clippings or scrapings for fungal studies.",
    barcodePrefix: "NAL",
  },
  { name: "Hair", description: "Hair shaft or root sample.", barcodePrefix: "HAR" },
  { name: "Semen", description: "Seminal fluid for semen analysis.", barcodePrefix: "SEM" },
];

export interface ParameterSeed {
  name: string;
  shortName: string;
  /** Catalogue MRP. */
  price: number;
  offerPrice: number | null;
  /** True = also sellable on its own, so it can go straight into a Package and
   *  the patient app renders "+ Add" for it. False = only ever reported as part
   *  of a Test. See the `Parameter` Prisma model doc-comment. */
  doTest: boolean;
  /** The booking fields below are populated ONLY for `doTest: true` analytes.
   *  A parameter that only ever appears nested inside a Test has no independent
   *  specimen, category, or turnaround — it inherits the hosting Test's — so
   *  leaving these undefined is the correct state, not missing data.
   *
   *  `sampleType` resolves against `SAMPLE_TYPE_SEEDS` by name; `category`
   *  against the CMS `AppCategory` tiles (Thyroid, Liver, Kidney, …), and is
   *  left undefined where no tile genuinely fits rather than forced into the
   *  nearest one. */
  sampleType?: string;
  category?: string;
  reportTime?: string;
  isFastingRequired?: boolean;
  fastingHours?: number;
}

export const PARAMETER_SEEDS: ParameterSeed[] = [
  // Hematology — CBC differential. Individual cell percentages are never
  // ordered alone, hence doTest: false for most of them.
  {
    name: "Hemoglobin",
    shortName: "HB",
    price: 120,
    offerPrice: 99,
    doTest: true,
    sampleType: "Blood",
    reportTime: "Same Day",
  },
  {
    name: "Total Leucocyte Count",
    shortName: "TLC",
    price: 120,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Fever",
    reportTime: "Same Day",
  },
  { name: "RBC Count", shortName: "RBC", price: 120, offerPrice: null, doTest: false },
  {
    name: "Platelet Count",
    shortName: "PLT",
    price: 150,
    offerPrice: 120,
    doTest: true,
    sampleType: "Blood",
    category: "Fever",
    reportTime: "Same Day",
  },
  { name: "Packed Cell Volume", shortName: "PCV", price: 100, offerPrice: null, doTest: false },
  { name: "Mean Corpuscular Volume", shortName: "MCV", price: 80, offerPrice: null, doTest: false },
  {
    name: "Mean Corpuscular Hemoglobin",
    shortName: "MCH",
    price: 80,
    offerPrice: null,
    doTest: false,
  },
  { name: "MCH Concentration", shortName: "MCHC", price: 80, offerPrice: null, doTest: false },
  { name: "Neutrophils", shortName: "NEUT", price: 60, offerPrice: null, doTest: false },
  { name: "Lymphocytes", shortName: "LYMPH", price: 60, offerPrice: null, doTest: false },
  { name: "Eosinophils", shortName: "EOS", price: 60, offerPrice: null, doTest: false },
  { name: "Monocytes", shortName: "MONO", price: 60, offerPrice: null, doTest: false },
  { name: "Basophils", shortName: "BASO", price: 60, offerPrice: null, doTest: false },
  {
    name: "Sedimentation Rate",
    shortName: "ESR-V",
    price: 100,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Arthritis",
    reportTime: "Same Day",
  },

  // Biochemistry — Liver
  {
    name: "Total Bilirubin",
    shortName: "TBIL",
    price: 100,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Liver",
    reportTime: "24 Hours",
  },
  { name: "Direct Bilirubin", shortName: "DBIL", price: 100, offerPrice: null, doTest: false },
  { name: "Indirect Bilirubin", shortName: "IBIL", price: 100, offerPrice: null, doTest: false },
  {
    name: "SGOT (AST)",
    shortName: "SGOT",
    price: 150,
    offerPrice: 120,
    doTest: true,
    sampleType: "Blood",
    category: "Liver",
    reportTime: "24 Hours",
  },
  {
    name: "SGPT (ALT)",
    shortName: "SGPT",
    price: 150,
    offerPrice: 120,
    doTest: true,
    sampleType: "Blood",
    category: "Liver",
    reportTime: "24 Hours",
  },
  {
    name: "Alkaline Phosphatase",
    shortName: "ALP",
    price: 150,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Liver",
    reportTime: "24 Hours",
  },
  { name: "Total Protein", shortName: "TPROT", price: 100, offerPrice: null, doTest: false },
  { name: "Albumin", shortName: "ALB", price: 100, offerPrice: null, doTest: false },
  { name: "Globulin", shortName: "GLOB", price: 100, offerPrice: null, doTest: false },

  // Biochemistry — Kidney
  {
    name: "Blood Urea",
    shortName: "UREA",
    price: 150,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Kidney",
    reportTime: "24 Hours",
  },
  { name: "Blood Urea Nitrogen", shortName: "BUN", price: 150, offerPrice: null, doTest: false },
  {
    name: "Serum Creatinine",
    shortName: "CREAT",
    price: 150,
    offerPrice: 120,
    doTest: true,
    sampleType: "Blood",
    category: "Kidney",
    reportTime: "24 Hours",
  },
  {
    name: "Uric Acid",
    shortName: "URIC",
    price: 150,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Arthritis",
    reportTime: "24 Hours",
  },

  // Biochemistry — Lipids
  {
    name: "Total Cholesterol",
    shortName: "CHOL",
    price: 150,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Heart",
    reportTime: "24 Hours",
    isFastingRequired: true,
    fastingHours: 12,
  },
  {
    name: "Triglycerides",
    shortName: "TRIG",
    price: 150,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Heart",
    reportTime: "24 Hours",
    isFastingRequired: true,
    fastingHours: 12,
  },
  { name: "HDL Cholesterol", shortName: "HDL", price: 150, offerPrice: null, doTest: false },
  { name: "LDL Cholesterol", shortName: "LDL", price: 150, offerPrice: null, doTest: false },
  { name: "VLDL Cholesterol", shortName: "VLDL", price: 100, offerPrice: null, doTest: false },

  // Biochemistry — Diabetes
  {
    name: "Fasting Blood Sugar",
    shortName: "FBS-V",
    price: 100,
    offerPrice: 80,
    doTest: true,
    sampleType: "Blood",
    category: "Diabetes",
    reportTime: "Same Day",
    isFastingRequired: true,
    fastingHours: 10,
  },
  {
    name: "Post Prandial Blood Sugar",
    shortName: "PPBS-V",
    price: 110,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Diabetes",
    reportTime: "Same Day",
  },
  {
    name: "Glycated Hemoglobin",
    shortName: "HBA1C-V",
    price: 500,
    offerPrice: 399,
    doTest: true,
    sampleType: "Blood",
    category: "Diabetes",
    reportTime: "24 Hours",
  },
  {
    name: "Estimated Average Glucose",
    shortName: "EAG",
    price: 100,
    offerPrice: null,
    doTest: false,
  },

  // Biochemistry — Thyroid
  {
    name: "Triiodothyronine (T3)",
    shortName: "T3",
    price: 200,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Thyroid",
    reportTime: "24 Hours",
  },
  {
    name: "Thyroxine (T4)",
    shortName: "T4",
    price: 200,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Thyroid",
    reportTime: "24 Hours",
  },
  {
    name: "Thyroid Stimulating Hormone",
    shortName: "TSH",
    price: 250,
    offerPrice: 199,
    doTest: true,
    sampleType: "Blood",
    category: "Thyroid",
    reportTime: "24 Hours",
  },

  // Biochemistry — Vitamins
  {
    name: "Vitamin B12",
    shortName: "B12",
    price: 900,
    offerPrice: 699,
    doTest: true,
    sampleType: "Blood",
    reportTime: "48 Hours",
  },
  {
    name: "Vitamin D (25-OH)",
    shortName: "VITD",
    price: 1200,
    offerPrice: 899,
    doTest: true,
    sampleType: "Blood",
    reportTime: "48 Hours",
  },

  // Biochemistry — Electrolytes
  { name: "Sodium", shortName: "NA", price: 150, offerPrice: null, doTest: false },
  { name: "Potassium", shortName: "K", price: 150, offerPrice: null, doTest: false },
  { name: "Chloride", shortName: "CL", price: 150, offerPrice: null, doTest: false },
  {
    name: "Serum Calcium",
    shortName: "CA",
    price: 250,
    offerPrice: 199,
    doTest: true,
    sampleType: "Blood",
    category: "Arthritis",
    reportTime: "Same Day",
  },

  // Serology
  {
    name: "Dengue NS1 Antigen",
    shortName: "DENG-NS1",
    price: 900,
    offerPrice: 699,
    doTest: true,
    sampleType: "Blood",
    category: "Fever",
    reportTime: "Same Day",
  },
  {
    name: "Hepatitis B Surface Antigen",
    shortName: "HBSAG-V",
    price: 350,
    offerPrice: 299,
    doTest: true,
    sampleType: "Blood",
    category: "Liver",
    reportTime: "24 Hours",
  },
  {
    name: "Widal Agglutination",
    shortName: "WIDAL-V",
    price: 200,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Fever",
    reportTime: "24 Hours",
  },
  {
    name: "Malaria Parasite",
    shortName: "MP-V",
    price: 150,
    offerPrice: null,
    doTest: true,
    sampleType: "Blood",
    category: "Fever",
    reportTime: "Same Day",
  },

  // Clinical Pathology — Urine routine
  { name: "Urine Colour", shortName: "U-COL", price: 50, offerPrice: null, doTest: false },
  { name: "Urine pH", shortName: "U-PH", price: 50, offerPrice: null, doTest: false },
  { name: "Urine Protein", shortName: "U-PROT", price: 60, offerPrice: null, doTest: false },
  { name: "Urine Sugar", shortName: "U-SUG", price: 60, offerPrice: null, doTest: false },
  { name: "Urine Pus Cells", shortName: "U-PUS", price: 60, offerPrice: null, doTest: false },
];

export interface TestSeed {
  name: string;
  shortName: string;
  /** The lab's INTERNAL taxonomy, resolved against `DEPARTMENT_SEEDS` / its
   *  nested categories by name. Optional now — the admin Test form categorises by
   *  `appCategory` instead, and a Test with neither is valid (the printed report
   *  falls back to the CMS category for its grouping label). Kept populated in
   *  the seed so the Department filter and report grouping have real data to
   *  exercise. */
  department?: string;
  category?: string;
  /** The CMS `AppCategory` tile (Thyroid, Liver, Kidney, …) — the admin form's
   *  "Category" dropdown, and the same taxonomy `PARAMETER_SEEDS` uses.
   *  Undefined where no tile genuinely fits. */
  appCategory?: string;
  isFastingRequired?: boolean;
  fastingHours?: number;
  recommendedFor?: "MALE" | "FEMALE" | "BOTH";
  recommendedAge?: string;
  sampleType: string;
  price: number;
  offerPrice: number | null;
  reportTime: string;
  description: string;
  isPopular: boolean;
  bookedCount: number;
  /** `Parameter.shortName`s, in report order — array position becomes
   *  `TestParameter.sortOrder`. An empty list is deliberate and supported: the
   *  Test then reports as a single free-text result line (see the
   *  `TestParameter` model doc-comment), and "Urine Culture & Sensitivity"
   *  below exists specifically to keep that path exercised. */
  parameters: string[];
}

export const TEST_SEEDS: TestSeed[] = [
  {
    name: "Complete Blood Count",
    shortName: "CBC",
    appCategory: "Fever",
    recommendedAge: "All ages",
    department: "Hematology",
    category: "Complete Blood Count",
    sampleType: "Blood",
    price: 350,
    offerPrice: 299,
    reportTime: "Same Day",
    description:
      "Full blood count with differential — screens for anemia, infection, and platelet disorders.",
    isPopular: true,
    bookedCount: 2140,
    parameters: [
      "HB",
      "TLC",
      "RBC",
      "PLT",
      "PCV",
      "MCV",
      "MCH",
      "MCHC",
      "NEUT",
      "LYMPH",
      "EOS",
      "MONO",
      "BASO",
    ],
  },
  {
    name: "Erythrocyte Sedimentation Rate",
    shortName: "ESR",
    appCategory: "Arthritis",
    recommendedAge: "All ages",
    department: "Hematology",
    category: "Complete Blood Count",
    sampleType: "Blood",
    price: 100,
    offerPrice: null,
    reportTime: "Same Day",
    description: "Non-specific marker of inflammation.",
    isPopular: false,
    bookedCount: 410,
    parameters: ["ESR-V"],
  },
  {
    name: "Liver Function Test",
    shortName: "LFT",
    appCategory: "Liver",
    recommendedAge: "18+ years",
    department: "Biochemistry",
    category: "Liver Function",
    sampleType: "Blood",
    price: 650,
    offerPrice: 499,
    reportTime: "24 Hours",
    description: "Bilirubin, enzymes, and proteins that together indicate liver health.",
    isPopular: true,
    bookedCount: 1320,
    parameters: ["TBIL", "DBIL", "IBIL", "SGOT", "SGPT", "ALP", "TPROT", "ALB", "GLOB"],
  },
  {
    name: "Kidney Function Test",
    shortName: "KFT",
    appCategory: "Kidney",
    recommendedAge: "18+ years",
    department: "Biochemistry",
    category: "Kidney Function",
    sampleType: "Blood",
    price: 600,
    offerPrice: 449,
    reportTime: "24 Hours",
    description: "Urea, creatinine, uric acid and electrolytes assessing renal clearance.",
    isPopular: true,
    bookedCount: 1180,
    parameters: ["UREA", "BUN", "CREAT", "URIC", "NA", "K"],
  },
  {
    name: "Lipid Profile",
    shortName: "LIPID",
    appCategory: "Heart",
    isFastingRequired: true,
    fastingHours: 12,
    recommendedFor: "BOTH",
    recommendedAge: "18+ years",
    department: "Biochemistry",
    category: "Lipid Profile",
    sampleType: "Blood",
    price: 500,
    offerPrice: 399,
    reportTime: "24 Hours",
    description: "Cholesterol fractions and triglycerides for cardiovascular risk.",
    isPopular: true,
    bookedCount: 1460,
    parameters: ["CHOL", "TRIG", "HDL", "LDL", "VLDL"],
  },
  {
    name: "Blood Sugar Fasting",
    shortName: "FBS",
    appCategory: "Diabetes",
    isFastingRequired: true,
    fastingHours: 10,
    recommendedFor: "BOTH",
    recommendedAge: "18+ years",
    department: "Biochemistry",
    category: "Diabetes",
    sampleType: "Blood",
    price: 120,
    offerPrice: null,
    reportTime: "Same Day",
    description: "Plasma glucose after an 8–12 hour fast.",
    isPopular: false,
    bookedCount: 980,
    parameters: ["FBS-V"],
  },
  {
    name: "Blood Sugar Post Prandial",
    shortName: "PPBS",
    appCategory: "Diabetes",
    recommendedFor: "BOTH",
    recommendedAge: "18+ years",
    department: "Biochemistry",
    category: "Diabetes",
    sampleType: "Blood",
    price: 130,
    offerPrice: null,
    reportTime: "Same Day",
    description: "Plasma glucose two hours after a meal.",
    isPopular: false,
    bookedCount: 760,
    parameters: ["PPBS-V"],
  },
  {
    name: "HbA1c",
    shortName: "HBA1C",
    appCategory: "Diabetes",
    recommendedFor: "BOTH",
    recommendedAge: "18+ years",
    department: "Biochemistry",
    category: "Diabetes",
    sampleType: "Blood",
    price: 500,
    offerPrice: 399,
    reportTime: "24 Hours",
    description: "Average glycemic control over the previous ~3 months.",
    isPopular: true,
    bookedCount: 1520,
    parameters: ["HBA1C-V", "EAG"],
  },
  {
    name: "Thyroid Profile (T3 T4 TSH)",
    shortName: "TFT",
    appCategory: "Thyroid",
    recommendedFor: "BOTH",
    recommendedAge: "All ages",
    department: "Biochemistry",
    category: "Thyroid",
    sampleType: "Blood",
    price: 450,
    offerPrice: 349,
    reportTime: "24 Hours",
    description: "Complete thyroid panel for hypo- and hyperthyroidism.",
    isPopular: true,
    bookedCount: 1690,
    parameters: ["T3", "T4", "TSH"],
  },
  {
    name: "Vitamin B12",
    shortName: "VITB12",
    recommendedFor: "BOTH",
    recommendedAge: "18+ years",
    department: "Biochemistry",
    category: "Vitamins",
    sampleType: "Blood",
    price: 900,
    offerPrice: 699,
    reportTime: "48 Hours",
    description: "Cobalamin level — deficiency causes fatigue and neuropathy.",
    isPopular: false,
    bookedCount: 540,
    parameters: ["B12"],
  },
  {
    name: "Vitamin D Total",
    shortName: "VITD",
    recommendedFor: "BOTH",
    recommendedAge: "All ages",
    department: "Biochemistry",
    category: "Vitamins",
    sampleType: "Blood",
    price: 1200,
    offerPrice: 899,
    reportTime: "48 Hours",
    description: "25-hydroxy vitamin D, the standard measure of vitamin D status.",
    isPopular: true,
    bookedCount: 1240,
    parameters: ["VITD"],
  },
  {
    name: "Serum Electrolytes",
    shortName: "ELECTRO",
    recommendedFor: "BOTH",
    recommendedAge: "All ages",
    department: "Biochemistry",
    category: "Electrolytes",
    sampleType: "Blood",
    price: 400,
    offerPrice: null,
    reportTime: "Same Day",
    description: "Sodium, potassium, and chloride balance.",
    isPopular: false,
    bookedCount: 320,
    parameters: ["NA", "K", "CL"],
  },
  {
    name: "Serum Calcium",
    shortName: "CALCIUM",
    appCategory: "Arthritis",
    recommendedFor: "BOTH",
    recommendedAge: "All ages",
    department: "Biochemistry",
    category: "Electrolytes",
    sampleType: "Blood",
    price: 250,
    offerPrice: 199,
    reportTime: "Same Day",
    description: "Total serum calcium — bone and parathyroid assessment.",
    isPopular: false,
    bookedCount: 280,
    parameters: ["CA"],
  },
  {
    name: "Dengue NS1 Antigen",
    shortName: "DENGUE",
    appCategory: "Fever",
    recommendedFor: "BOTH",
    recommendedAge: "All ages",
    department: "Serology",
    category: "Infectious Disease",
    sampleType: "Blood",
    price: 900,
    offerPrice: 699,
    reportTime: "Same Day",
    description: "Early dengue detection, positive from day one of fever.",
    isPopular: true,
    bookedCount: 870,
    parameters: ["DENG-NS1"],
  },
  {
    name: "HBsAg (Hepatitis B)",
    shortName: "HBSAG",
    appCategory: "Liver",
    recommendedFor: "BOTH",
    recommendedAge: "18+ years",
    department: "Serology",
    category: "Infectious Disease",
    sampleType: "Blood",
    price: 350,
    offerPrice: 299,
    reportTime: "24 Hours",
    description: "Hepatitis B surface antigen screening.",
    isPopular: false,
    bookedCount: 430,
    parameters: ["HBSAG-V"],
  },
  {
    name: "Widal Test",
    shortName: "WIDAL",
    appCategory: "Fever",
    recommendedFor: "BOTH",
    recommendedAge: "All ages",
    department: "Serology",
    category: "Infectious Disease",
    sampleType: "Blood",
    price: 200,
    offerPrice: null,
    reportTime: "24 Hours",
    description: "Agglutination test for enteric (typhoid) fever.",
    isPopular: false,
    bookedCount: 390,
    parameters: ["WIDAL-V"],
  },
  {
    name: "Malaria Parasite Smear",
    shortName: "MPSMEAR",
    appCategory: "Fever",
    recommendedFor: "BOTH",
    recommendedAge: "All ages",
    department: "Clinical Pathology",
    category: "Parasitology",
    sampleType: "Blood",
    price: 150,
    offerPrice: null,
    reportTime: "Same Day",
    description: "Peripheral smear examination for malarial parasites.",
    isPopular: false,
    bookedCount: 350,
    parameters: ["MP-V"],
  },
  {
    name: "Urine Routine Examination",
    shortName: "URE",
    recommendedFor: "BOTH",
    recommendedAge: "All ages",
    department: "Clinical Pathology",
    category: "Urine Analysis",
    sampleType: "Urine",
    price: 150,
    offerPrice: null,
    reportTime: "Same Day",
    description: "Physical, chemical, and microscopic urine examination.",
    isPopular: false,
    bookedCount: 620,
    parameters: ["U-COL", "U-PH", "U-PROT", "U-SUG", "U-PUS"],
  },
  {
    name: "Urine Culture & Sensitivity",
    shortName: "URINECS",
    recommendedFor: "BOTH",
    recommendedAge: "All ages",
    department: "Microbiology",
    category: "Culture & Sensitivity",
    sampleType: "Urine",
    price: 600,
    offerPrice: null,
    reportTime: "72 Hours",
    description: "Organism isolation with antibiotic sensitivity — reported as free text.",
    isPopular: false,
    bookedCount: 190,
    // Intentionally empty: a culture report is a narrative, not a set of
    // numeric analytes. Keeps the zero-parameter Report Entry fallback covered
    // by real seed data rather than only by tests.
    parameters: [],
  },
];
