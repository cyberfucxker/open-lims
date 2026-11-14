/** Launch catalogue of health-checkup packages for the Patient App, seeded
 *  (idempotently) by `prisma/seed.ts`.
 *
 *  `price` is the catalogue MRP the app strikes through as `actual_price`, and
 *  `offerPrice` is what it actually sells at (`offer_price`) — see
 *  `listPackages()` in `src/services/app/catalog.service.ts`. Every MRP here is
 *  the exact sum of its member tests' own `Test.price`, so the discount shown to
 *  the patient is real rather than an invented anchor.
 *
 *  `isPopular` is what surfaces a package in the Home screen's "Popular
 *  Packages" rail (and tags it "Popular" in the catalogue), so only a few carry
 *  it — the rail stops meaning anything if everything is popular. */

export interface PackageSeed {
  name: string;
  /** Catalogue MRP. Kept equal to the sum of the member tests' + parameters' prices. */
  price: number;
  /** Discounted selling price shown in the app. */
  offerPrice: number;
  isPopular: boolean;
  /** Social-proof count rendered as "N+ people booked this" in the app. */
  bookedCount: number;
  /** `Test.shortName`s, resolved to ids at seed time via the same one-or-none
   *  rule the API uses.
   *
   *  Order matters: the app derives a package's single `reporting_time` from its
   *  FIRST test (`packageTests[0].test.reportTime`), so each list leads with its
   *  slowest-reporting test. Leading with a "Same Day" test would advertise a
   *  turnaround the package as a whole can't hit. */
  tests: string[];
  /** `Parameter.shortName`s sold directly by this package rather than through a
   *  member Test. Only `doTest: true` parameters are allowed here — the seed
   *  goes through the same validation the admin API does. Left empty for most
   *  packages: bundling a whole Test is the norm, and pulling a lone analyte in
   *  only makes sense when it isn't already covered by one of the tests. */
  parameters: string[];
  /** The CMS `AppCategory` tile — same taxonomy Tests and Parameters use.
   *  Undefined where no tile fits a broad multi-organ panel. */
  category?: string;
  /** Declared primary specimen. Every seeded package is blood-only apart from
   *  the ones that include a urine test, which are genuinely mixed and so leave
   *  this unset rather than claim one. */
  sampleType?: string;
  /** Declared turnaround for the package as a whole. Left undefined lets the app
   *  derive it from the first-listed (slowest) member test. */
  reportTime?: string;
  isFastingRequired?: boolean;
  fastingHours?: number;
  recommendedFor?: "MALE" | "FEMALE" | "BOTH";
  recommendedAge?: string;
  description?: string;
}

export const PACKAGE_SEEDS: PackageSeed[] = [
  {
    name: "Full Body Checkup - Advanced",
    reportTime: "48 Hours",
    isFastingRequired: true,
    fastingHours: 12,
    recommendedFor: "BOTH",
    recommendedAge: "18+ years",
    description:
      "A complete organ-by-organ screen — liver, kidney, thyroid, lipids, sugar, blood count, and urine.",
    // 650 + 600 + 450 + 250 + 500 + 350 + 120 + 400 + 150
    price: 3470,
    offerPrice: 2199,
    isPopular: true,
    bookedCount: 1840,
    tests: ["LFT", "KFT", "TFT", "CALCIUM", "LIPID", "CBC", "FBS", "ELECTRO", "URE"],
    parameters: [],
  },
  {
    name: "Diabetes Screening Panel",
    category: "Diabetes",
    reportTime: "24 Hours",
    isFastingRequired: true,
    fastingHours: 10,
    recommendedFor: "BOTH",
    recommendedAge: "18+ years",
    description: "Confirms or rules out diabetes and checks the organs it damages first.",
    // 500 + 600 + 500 + 120 + 130 + 150
    price: 2000,
    offerPrice: 1299,
    isPopular: true,
    bookedCount: 1120,
    tests: ["HBA1C", "KFT", "LIPID", "FBS", "PPBS", "URE"],
    parameters: [],
  },
  {
    name: "Vitamin & Thyroid Care Panel",
    category: "Thyroid",
    sampleType: "Blood",
    reportTime: "48 Hours",
    recommendedFor: "BOTH",
    recommendedAge: "18+ years",
    description:
      "Thyroid hormones alongside the two vitamin deficiencies that mimic thyroid symptoms.",
    // 1200 + 900 + 450 + 350
    price: 2900,
    offerPrice: 1899,
    isPopular: true,
    bookedCount: 760,
    tests: ["VITD", "VITB12", "TFT", "CBC"],
    parameters: [],
  },
  {
    name: "Fever & Infection Panel",
    category: "Fever",
    reportTime: "Same Day",
    recommendedFor: "BOTH",
    recommendedAge: "All ages",
    description:
      "Same-day workup for an undiagnosed fever — dengue, malaria, typhoid, and inflammation markers.",
    // 900 + 350 + 200 + 150 + 100 + 150 = 1850
    price: 1850,
    offerPrice: 1249,
    isPopular: false,
    bookedCount: 540,
    tests: ["DENGUE", "CBC", "WIDAL", "MPSMEAR", "ESR", "URE"],
    parameters: [],
  },
  {
    name: "Liver & Kidney Care Panel",
    category: "Liver",
    reportTime: "24 Hours",
    recommendedFor: "BOTH",
    recommendedAge: "18+ years",
    description: "Full liver and kidney function with electrolytes and urine examination.",
    // 650 + 600 + 350 + 400 + 150
    price: 2150,
    offerPrice: 1449,
    isPopular: false,
    bookedCount: 480,
    tests: ["LFT", "KFT", "CBC", "ELECTRO", "URE"],
    parameters: [],
  },
  {
    name: "Essential Heart Watch",
    category: "Heart",
    sampleType: "Blood",
    reportTime: "24 Hours",
    isFastingRequired: true,
    fastingHours: 12,
    recommendedFor: "BOTH",
    recommendedAge: "30+ years",
    description:
      "Cardiovascular risk screen — lipid fractions, blood count, fasting sugar, and liver enzymes.",
    // LIPID 500 + CBC 350 + FBS 120, plus two standalone analytes: SGOT 150 +
    // SGPT 150. Exercises the standalone-parameter side of a package — those two
    // enzymes aren't worth bundling a whole LFT for here.
    price: 1270,
    offerPrice: 899,
    isPopular: false,
    bookedCount: 260,
    tests: ["LIPID", "CBC", "FBS"],
    parameters: ["SGOT", "SGPT"],
  },
];
