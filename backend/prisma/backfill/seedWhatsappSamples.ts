/**
 * SAMPLE knowledge-base entries and concern→test mappings for the WhatsApp
 * assistant. Everything is created INACTIVE and titled
 * "SAMPLE - medical team review": the assistant never sees a row until the
 * medical team has reviewed, edited and switched it on in Superadmin →
 * WhatsApp Assistant. Idempotent — re-running skips rows that already exist.
 *
 *   npm run seed:whatsapp-samples -w backend
 *   DRY_RUN=1 npm run seed:whatsapp-samples -w backend   # resolve only, write nothing
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const MARK = "SAMPLE - medical team review";

const KNOWLEDGE: Array<{ title: string; body: string }> = [
  {
    title: "Fasting before blood tests",
    body:
      "Tests that need fasting (for example fasting sugar or lipid profile) need 8–12 hours without food; " +
      "plain water is allowed. Each test's own fasting requirement is shown by the booking system. " +
      "[Review: confirm the wording and any exceptions.]",
  },
  {
    title: "How home collection works",
    body:
      "A trained phlebotomist visits the address at the booked slot, collects the sample and takes it to our lab. " +
      "The customer gets a message when the phlebotomist is assigned. [Review: add ID/PIN process if used.]",
  },
  {
    title: "Report turnaround time",
    body:
      "Most routine reports are ready within 24 hours of sample collection; each test shows its own report time. " +
      "Reports can be downloaded from the app or requested here on WhatsApp. [Review: confirm TAT.]",
  },
  {
    title: "Payment modes",
    body:
      "Bookings made on WhatsApp are paid by cash (or UPI to the phlebotomist) at the time of collection. " +
      "[Review: confirm UPI is accepted at the door.]",
  },
  {
    title: "Refund and cancellation policy",
    body: "[Fill in the actual refund/cancellation policy before activating this entry.]",
  },
  {
    title: "Working hours",
    body: "[Fill in collection hours, lab hours and customer-care hours before activating this entry.]",
  },
];

/** Tests are referenced by `Test.shortName` (exact), packages by exact
 *  name — anything missing in a given catalogue is skipped and reported.
 *  Keywords are matched as substrings of the customer's message, so keep
 *  them specific (no bare "bp", "tb", "ulti" — they occur inside other words). */
const MAPPINGS: Array<{
  concern: string;
  keywords: string[];
  tests: string[];
  packages: string[];
  notes: string;
}> = [
  // ── Fever & infections ──
  {
    concern: "Fever",
    keywords: [
      "fever",
      "bukhar",
      "bukhaar",
      "bhukhar",
      "taap",
      "jwar",
      "बुखार",
      "ज्वर",
      "temperature hai",
    ],
    tests: ["CBC", "MPP", "TYPHI DOT", "CRPQ", "URR"],
    packages: [],
    notes:
      "Fever for more than 3 days, very high fever or fever in an infant needs a doctor first.",
  },
  {
    concern: "Dengue",
    keywords: [
      "dengue",
      "dengu",
      "डेंगू",
      "platelet kam",
      "platelets low",
      "low platelet",
      "platelet count",
    ],
    tests: ["DENGUE NS1", "DENGP", "CBC"],
    packages: [],
    notes:
      "NS1 is useful in the first 5 days of fever; IgM/IgG later. Bleeding or severe pain = emergency.",
  },
  {
    concern: "Malaria",
    keywords: [
      "malaria",
      "maleria",
      "मलेरिया",
      "kaanp ke bukhar",
      "thand lag ke bukhar",
      "thand ke saath bukhar",
    ],
    tests: ["MPP", "PLDH", "CBC"],
    packages: [],
    notes: "",
  },
  {
    concern: "Typhoid",
    keywords: ["typhoid", "taifaid", "taifoid", "टाइफाइड", "motijhara", "miyadi bukhar", "मियादी"],
    tests: ["TYPHI DOT", "WIDT", "CBC"],
    packages: [],
    notes: "Widal is more meaningful after the first week of fever.",
  },
  {
    concern: "Chikungunya",
    keywords: ["chikungunya", "chikungunia", "chikangunia", "चिकनगुनिया"],
    tests: ["CHIKUN", "CBC"],
    packages: [],
    notes: "",
  },
  {
    concern: "Scrub typhus",
    keywords: ["scrub typhus", "scrub"],
    tests: ["STAP", "CBC"],
    packages: [],
    notes: "",
  },
  {
    concern: "COVID / flu",
    keywords: [
      "covid",
      "corona",
      "कोरोना",
      "influenza",
      "swine flu",
      "flu jaisa",
      "flu ke lakshan",
    ],
    tests: ["COVID19", "CBC", "CRPQ"],
    packages: [],
    notes: "Breathlessness is a red flag — the assistant hands off instead of booking.",
  },
  {
    concern: "Tuberculosis / long cough",
    keywords: [
      "tuberculosis",
      "टीबी",
      "t.b.",
      "kshay rog",
      "purani khansi",
      "2 hafte se khansi",
      "do hafte se khansi",
      "balgam",
      "cough for weeks",
    ],
    tests: ["AFBSS", "TBF", "CBC", "ESR"],
    packages: [],
    notes: "Coughing up blood or weight loss with night sweats needs a doctor promptly.",
  },
  {
    concern: "Urine infection",
    keywords: [
      "urine infection",
      "peshab me jalan",
      "peshab mein jalan",
      "पेशाब में जलन",
      "burning urine",
      "burning while urinating",
      "peshab me infection",
    ],
    tests: ["URR", "CULURI"],
    packages: [],
    notes: "",
  },
  {
    concern: "Stomach infection / loose motions",
    keywords: [
      "loose motion",
      "dast ho",
      "dast lag",
      "दस्त",
      "diarrhea",
      "diarrhoea",
      "pet kharab",
      "stomach infection",
      "pet me infection",
      "food poisoning",
      "vomiting",
      "ulti ho",
      "ulti aa",
    ],
    tests: ["STOOLR", "CBC", "ELECT"],
    packages: [],
    notes: "Signs of dehydration or blood in stool need a doctor first.",
  },
  {
    concern: "Acidity / H. pylori",
    keywords: [
      "acidity",
      "gas banti",
      "khatte dakar",
      "pet me jalan",
      "pet mein jalan",
      "ulcer",
      "h pylori",
      "h. pylori",
      "एसिडिटी",
    ],
    tests: ["HPYLORI", "CBC"],
    packages: [],
    notes: "",
  },
  // ── Blood, weakness, vitamins ──
  {
    concern: "Weakness / tiredness",
    keywords: [
      "kamzori",
      "kamjori",
      "कमजोरी",
      "weakness",
      "thakan",
      "थकान",
      "fatigue",
      "tiredness",
      "tired rehta",
      "energy nahi",
      "chakkar aate",
    ],
    tests: ["CBC", "D3", "B12", "THY", "GLR"],
    packages: ["Example Advance Care"],
    notes: "",
  },
  {
    concern: "Anaemia (low haemoglobin)",
    keywords: [
      "anemia",
      "anaemia",
      "khoon ki kami",
      "खून की कमी",
      "hemoglobin kam",
      "haemoglobin kam",
      "hb kam",
      "hb low",
      "khoon kam",
    ],
    tests: ["CBC", "IRONP", "FERIT", "B12", "FOLIC"],
    packages: [],
    notes: "",
  },
  {
    concern: "Vitamin deficiency",
    keywords: [
      "vitamin",
      "विटामिन",
      "vit d",
      "b12",
      "numbness",
      "jhunjhuni",
      "jhunjhunahat",
      "haath pair sunn",
    ],
    tests: ["D3", "B12", "CALL", "FOLIC"],
    packages: ["Example Super Care"],
    notes: "",
  },
  {
    concern: "Hair fall",
    keywords: [
      "hair fall",
      "hairfall",
      "baal jhad",
      "baal girna",
      "baal gir",
      "बाल झड़",
      "बाल गिर",
    ],
    tests: ["CBC", "FERIT", "D3", "B12", "CORTSH"],
    packages: [],
    notes: "",
  },
  // ── Bones & joints ──
  {
    concern: "Bone / back / joint pain",
    keywords: [
      "haddi",
      "हड्डी",
      "bone pain",
      "joint pain",
      "jodo me dard",
      "jodon mein dard",
      "जोड़ों",
      "ghutne",
      "knee pain",
      "kamar dard",
      "back pain",
      "कमर दर्द",
    ],
    tests: ["D3", "CALL", "URIC", "RAF"],
    packages: [],
    notes: "",
  },
  {
    concern: "Arthritis / joint swelling",
    keywords: [
      "arthritis",
      "gathiya",
      "गठिया",
      "joint swelling",
      "jodo me sujan",
      "jodon mein sujan",
      "morning stiffness",
      "rheumatoid",
    ],
    tests: ["RAF", "CCP", "ESR", "CRPQ", "URIC"],
    packages: [],
    notes: "",
  },
  {
    concern: "Uric acid / gout",
    keywords: ["uric", "yurik", "gout", "अंगूठे में दर्द", "angoothe me dard"],
    tests: ["URIC", "RFTT"],
    packages: [],
    notes: "",
  },
  // ── Sugar, heart, BP, weight ──
  {
    concern: "Sugar / diabetes",
    keywords: [
      "sugar",
      "diabetes",
      "diabetic",
      "madhumeh",
      "मधुमेह",
      "शुगर",
      "डायबिटीज",
      "zyada pyaas",
      "bahut pyaas",
      "bar bar peshab",
      "baar baar peshab",
    ],
    tests: ["GLFF", "GLPP2", "HBA1C"],
    packages: ["Example Total Care"],
    notes: "Fasting sugar needs 8–10 hours fasting; PP sugar is taken 2 hours after a meal.",
  },
  {
    concern: "Cholesterol / heart health check",
    keywords: [
      "cholesterol",
      "कोलेस्ट्रॉल",
      "lipid",
      "triglyceride",
      "heart checkup",
      "heart check up",
      "dil ki jaanch",
      "dil ka checkup",
      "heart health",
    ],
    tests: ["LIPID", "ELPC", "HSCRP", "GLFF"],
    packages: ["Example Screen Care"],
    notes:
      "Chest pain is a red flag — the assistant hands off instead of booking. Lipid profile needs 10–12 hours fasting.",
  },
  {
    concern: "Blood pressure",
    keywords: [
      "blood pressure",
      "hypertension",
      "high bp",
      "bp high",
      "bp ki",
      "bp ka",
      "bp badh",
      "बीपी",
      "ब्लड प्रेशर",
    ],
    tests: ["LIPID", "RFTT", "ELECT", "GLFF", "URR"],
    packages: [],
    notes: "",
  },
  {
    concern: "Weight gain / obesity",
    keywords: [
      "motapa",
      "मोटापा",
      "obesity",
      "weight gain",
      "vajan badh",
      "wajan badh",
      "वजन बढ़",
      "weight kam nahi",
    ],
    tests: ["THY", "LIPID", "GLFF", "HBA1C", "INSF"],
    packages: [],
    notes: "",
  },
  // ── Thyroid & hormones ──
  {
    concern: "Thyroid",
    keywords: ["thyroid", "thairoid", "थायराइड", "tsh", "goitre", "galgand"],
    tests: ["THY", "CORTSH", "FTP", "TPO"],
    packages: [],
    notes: "",
  },
  {
    concern: "PCOS / irregular periods",
    keywords: [
      "pcos",
      "pcod",
      "irregular period",
      "periods time pe nahi",
      "period late",
      "mahvari",
      "माहवारी",
      "period problem",
      "periods ki problem",
      "chehre pe baal",
    ],
    tests: ["LH", "FSH", "PRL", "TESTT", "CORTSH", "GLFF"],
    packages: [],
    notes: "The full PCOS panel (POSP) is also available if the doctor advises it.",
  },
  {
    concern: "Pregnancy test",
    keywords: [
      "pregnancy test",
      "pregnant",
      "garbh",
      "गर्भ",
      "pregnancy check",
      "period miss",
      "periods miss",
      "hcg",
    ],
    tests: ["HCG", "UHCG"],
    packages: [],
    notes: "Blood beta-hCG is the more sensitive test.",
  },
  {
    concern: "Pregnancy (antenatal) screening",
    keywords: [
      "antenatal",
      "garbhavastha",
      "गर्भावस्था",
      "pregnancy me test",
      "pregnancy mein test",
      "double marker",
      "quadruple marker",
      "torch test",
    ],
    tests: ["CBC", "URR", "CORTSH", "AUS", "HIVC", "VDRLS", "DOUBLE MARKER", "QUAD"],
    packages: [],
    notes: "Marker tests depend on the week of pregnancy — the gynaecologist decides which one.",
  },
  {
    concern: "Female fertility",
    keywords: [
      "infertility",
      "conceive",
      "baby nahi ho",
      "bachcha nahi ho",
      "amh",
      "ovarian reserve",
      "bachche ki planning",
    ],
    tests: ["AMHH", "FSH", "LH", "PRL", "CORTSH", "E2"],
    packages: [],
    notes: "",
  },
  {
    concern: "Male fertility",
    keywords: ["sperm", "semen", "शुक्राणु", "sperm count", "male infertility"],
    tests: ["SEMEN", "TESTT", "FSH", "LH"],
    packages: [],
    notes: "Semen analysis needs 2–5 days abstinence.",
  },
  {
    concern: "Prostate",
    keywords: [
      "prostate",
      "प्रोस्टेट",
      "peshab ruk ke",
      "peshab ki dhaar kamzor",
      "weak urine stream",
    ],
    tests: ["PSAT", "PSAF", "URR"],
    packages: [],
    notes: "",
  },
  // ── Organs ──
  {
    concern: "Liver check",
    keywords: [
      "liver test",
      "liver check",
      "liver function",
      "liver ki",
      "liver me",
      "liver problem",
      "lft",
      "लीवर",
      "jigar",
      "जिगर",
      "fatty liver",
      "sgpt",
      "sgot",
      "alcohol peete",
    ],
    tests: ["LFTJ", "ELFTP", "AUS", "HCVT"],
    packages: [],
    notes: "",
  },
  {
    concern: "Jaundice",
    keywords: [
      "jaundice",
      "piliya",
      "peeliya",
      "पीलिया",
      "aankh peeli",
      "aankhen peeli",
      "yellow eyes",
    ],
    tests: ["BT", "LFTJ", "HAVM", "HEVM", "AUS"],
    packages: [],
    notes: "",
  },
  {
    concern: "Kidney check",
    keywords: [
      "kidney",
      "किडनी",
      "gurda",
      "गुर्दा",
      "creatinine",
      "urea",
      "pairon me sujan",
      "pairo me sujan",
    ],
    tests: ["RFTT", "ERKFT", "URR", "MALL"],
    packages: [],
    notes: "",
  },
  {
    concern: "Kidney stone",
    keywords: ["kidney stone", "stone hai", "stone ki", "stone ka", "pathri", "पथरी"],
    tests: ["URR", "RFTT", "URIC", "CALL"],
    packages: [],
    notes: "Severe pain with fever or vomiting needs a doctor first.",
  },
  // ── Allergy ──
  {
    concern: "Allergy / itching",
    keywords: [
      "allergy",
      "एलर्जी",
      "khujli",
      "खुजली",
      "itching",
      "rashes",
      "chhinke",
      "chheenk",
      "sneezing",
      "daane",
    ],
    tests: ["IGEE", "TEC", "PHADIA", "CBC"],
    packages: [],
    notes: "Food/inhalant/drug allergy panels (ALLFIN, ALLC) are available on the doctor's advice.",
  },
  // ── Screening ──
  {
    concern: "Infection screening (HIV / hepatitis / syphilis)",
    keywords: [
      "hiv",
      "aids test",
      "aids ki",
      "hepatitis",
      "हेपेटाइटिस",
      "syphilis",
      "vdrl",
      "std",
      "unsafe sex",
      "sexually transmitted",
    ],
    tests: ["HIVC", "AUS", "HCVT", "VDRLS"],
    packages: [],
    notes: "",
  },
  {
    concern: "Pre-surgery / pre-employment check",
    keywords: [
      "pre operative",
      "pre-operative",
      "operation se pehle",
      "surgery se pehle",
      "pre employment",
      "pre-employment",
      "medical fitness",
      "fitness certificate",
      "job ke liye test",
    ],
    tests: ["CBC", "GLR", "RFTT", "AUS", "HCVT", "HIVC", "PTI-456", "URR"],
    packages: [],
    notes: "The surgeon/employer's own list takes priority.",
  },
  // ── Packages ──
  {
    concern: "Full body checkup",
    keywords: [
      "full body",
      "full-body",
      "fullbody",
      "body checkup",
      "body check up",
      "health checkup",
      "health check up",
      "complete checkup",
      "routine checkup",
      "annual checkup",
      "poora checkup",
      "pura checkup",
      "पूरी जांच",
      "बॉडी चेकअप",
    ],
    tests: [],
    packages: [
      "Example Total Care",
      "Example Advance Care",
      "Example Complete Care",
      "Example Platinum Care",
    ],
    notes: "",
  },
  {
    concern: "Basic / budget checkup",
    keywords: [
      "basic checkup",
      "basic test",
      "sasta",
      "kam price",
      "cheap checkup",
      "chhota checkup",
      "budget",
    ],
    tests: [],
    packages: ["Example Lite Care", "Example Screen Care"],
    notes: "",
  },
  {
    concern: "Senior citizen checkup",
    keywords: [
      "senior citizen",
      "buzurg",
      "बुजुर्ग",
      "old age",
      "maa papa",
      "mummy papa",
      "parents ka checkup",
      "parents checkup",
      "60 saal",
      "65 saal",
      "70 saal",
    ],
    tests: [],
    packages: ["Example Senior Citizen Care - Male", "Example Senior Citizen Care - Female"],
    notes: "Pick the male or female package by the patient's gender.",
  },
  // ── Added: more everyday concerns ──
  {
    concern: "Pre-marital / thalassemia screening",
    keywords: [
      "shaadi se pehle",
      "shadi se pehle",
      "pre marital",
      "pre-marital",
      "premarital",
      "thalassemia",
      "थैलेसीमिया",
      "marriage ke liye test",
    ],
    tests: ["BGCONF", "CBC", "HBEE", "NESTROFT", "HIVC", "AUS", "VDRLS"],
    packages: [],
    notes: "",
  },
  {
    concern: "Blood group",
    keywords: ["blood group", "khoon ka group", "ब्लड ग्रुप", "rh factor"],
    tests: ["BGCONF"],
    packages: [],
    notes: "",
  },
  {
    concern: "Bleeding gums / easy bruising",
    keywords: [
      "masoodo se khoon",
      "masudon se khoon",
      "मसूड़ों से खून",
      "bleeding gums",
      "neel pad",
      "neele nishan",
      "bruising",
      "nakseer",
      "naak se khoon",
    ],
    tests: ["CBC", "PTI-456", "PTTK", "BTCT", "PBFF"],
    packages: [],
    notes:
      "Heavy or non-stop bleeding is an emergency — the assistant hands off instead of booking.",
  },
  {
    concern: "Blood thinner (INR) monitoring",
    keywords: [
      "warfarin",
      "acitrom",
      "blood thinner",
      "khoon patla",
      "inr test",
      "pt inr",
      "inr check",
    ],
    tests: ["PTI-456"],
    packages: [],
    notes: "",
  },
  {
    concern: "Muscle cramps / body ache",
    keywords: [
      "muscle cramp",
      "leg cramp",
      "nas chadh",
      "naso me khinchav",
      "ainthan",
      "muscle pain",
      "body pain",
      "badan dard",
      "बदन दर्द",
      "maaspeshiyon me dard",
    ],
    tests: ["ELECT", "CALL", "MAG", "D3", "CPKT"],
    packages: [],
    notes: "",
  },
  {
    concern: "Menopause",
    keywords: [
      "menopause",
      "rajonivritti",
      "periods band",
      "periods band ho gaye",
      "hot flashes",
      "garmi ke jhatke",
    ],
    tests: ["FSH", "E2", "LH", "D3", "CALL", "LIPID"],
    packages: [],
    notes: "",
  },
  {
    concern: "Weak bones / osteoporosis",
    keywords: [
      "osteoporosis",
      "haddi kamzor",
      "haddiyan kamzor",
      "kamzor haddi",
      "calcium kam",
      "calcium ki kami",
      "calcium test",
    ],
    tests: ["D3", "CALL", "PHOS", "ALK"],
    packages: [],
    notes: "",
  },
  {
    concern: "Child growth / height",
    keywords: [
      "height nahi badh",
      "lambai nahi badh",
      "bachche ki height",
      "growth kam",
      "kad chhota",
      "kad nahi badh",
      "बच्चे की लंबाई",
    ],
    tests: ["D3", "CALL", "PHOS", "CORTSH", "CBC"],
    packages: [],
    notes: "Growth-hormone tests only on a paediatrician's advice.",
  },
  {
    concern: "Mouth ulcers",
    keywords: ["munh ke chhale", "muh me chhale", "mouth ulcer", "छाले", "chhale"],
    tests: ["CBC", "B12", "FOLIC", "FERIT"],
    packages: [],
    notes: "",
  },
  {
    concern: "Unexplained weight loss",
    keywords: [
      "weight loss ho raha",
      "vajan kam ho",
      "wajan kam ho",
      "vajan ghat",
      "wajan ghat",
      "वजन कम हो",
      "patla ho raha",
      "weight gir raha",
    ],
    tests: ["THY", "HBA1C", "CBC", "ESR", "HIVC"],
    packages: [],
    notes: "Significant unexplained weight loss needs a doctor's evaluation.",
  },
  {
    concern: "Palpitations",
    keywords: ["dhadkan tez", "dil ki dhadkan", "palpitation", "ghabrahat", "घबराहट", "धड़कन"],
    tests: ["THY", "CBC", "ELECT", "GLR"],
    packages: [],
    notes:
      "With chest pain, fainting or breathlessness it is an emergency — the assistant hands off.",
  },
  {
    concern: "Low immunity / frequent infections",
    keywords: [
      "baar baar bimar",
      "bar bar bimar",
      "immunity kam",
      "low immunity",
      "frequent infection",
      "jaldi bimar",
    ],
    tests: ["CBC", "HBA1C", "D3", "HIVC"],
    packages: [],
    notes: "",
  },
  {
    concern: "Stomach worms",
    keywords: ["pet me keede", "pet mein keede", "keede", "worms", "कीड़े"],
    tests: ["STOOLR", "CBC", "TEC"],
    packages: [],
    notes: "",
  },
  {
    concern: "Filaria",
    keywords: ["filaria", "haathi paon", "hathi paon", "हाथी पांव", "फाइलेरिया"],
    tests: ["FILARIAANTIG", "CBC", "TEC"],
    packages: [],
    notes: "",
  },
  {
    concern: "Hepatitis B vaccine / immunity check",
    keywords: [
      "hepatitis b vaccine",
      "hep b vaccine",
      "anti hbs",
      "vaccine ke baad antibody",
      "hepatitis b immunity",
    ],
    tests: ["HBSAB", "AUS"],
    packages: [],
    notes: "",
  },
  {
    concern: "Sugar in pregnancy",
    keywords: [
      "pregnancy me sugar",
      "pregnancy mein sugar",
      "pregnancy sugar",
      "gestational",
      "garbhavastha me sugar",
    ],
    tests: ["GTT", "HBA1C", "GLFF"],
    packages: [],
    notes:
      "The glucose tolerance test is usually done at 24–28 weeks, as the gynaecologist advises.",
  },
  {
    concern: "Pimples / acne",
    keywords: ["pimples", "pimple", "acne", "muhase", "मुंहासे", "dane chehre"],
    tests: ["TESTT", "DHEA", "LH", "FSH", "PRL"],
    packages: [],
    notes: "",
  },
  {
    concern: "Men's health / low energy",
    keywords: [
      "men health",
      "men's health",
      "testosterone",
      "mardana kamzori",
      "libido kam",
      "sex drive kam",
      "josh kam",
    ],
    tests: ["TESTT", "CORTSH", "GLFF", "LIPID", "D3"],
    packages: [],
    notes: "",
  },
  {
    concern: "Alcohol use check",
    keywords: ["sharab", "daaru", "daru peeta", "drinking alcohol", "alcohol ka asar", "शराब"],
    tests: ["LFTJ", "ELFTP", "LIPID", "GLFF", "CBC"],
    packages: [],
    notes: "",
  },
];

async function findTestIds(codes: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const code of codes) {
    const test = await prisma.test.findFirst({
      where: { status: "Active", shortName: { equals: code, mode: "insensitive" } },
      select: { id: true },
    });
    if (test && !ids.includes(test.id)) ids.push(test.id);
    else if (!test) console.log(`  · test code not in this catalogue: "${code}" (skipped)`);
  }
  return ids;
}

async function findPackageIds(names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    const pkg = await prisma.package.findFirst({
      where: {
        active: true,
        deletedAt: null,
        name: { equals: name, mode: "insensitive" },
        packageTests: { some: {} },
      },
      select: { id: true },
    });
    if (pkg && !ids.includes(pkg.id)) ids.push(pkg.id);
    else if (!pkg) console.log(`  · package not in this catalogue: "${name}" (skipped)`);
  }
  return ids;
}

const DRY_RUN = process.env.DRY_RUN === "1";

async function main() {
  for (const entry of KNOWLEDGE) {
    const title = `${MARK}: ${entry.title}`;
    if (await prisma.whatsappKnowledgeEntry.findFirst({ where: { title } })) continue;
    if (DRY_RUN) {
      console.log(`KB  (dry) ${title}`);
      continue;
    }
    await prisma.whatsappKnowledgeEntry.create({
      data: { title, body: entry.body, isActive: false },
    });
    console.log(`KB  + ${title}`);
  }

  for (const mapping of MAPPINGS) {
    const concern = `${MARK}: ${mapping.concern}`;
    if (await prisma.concernTestMapping.findFirst({ where: { concern } })) continue;
    const [testIds, packageIds] = await Promise.all([
      findTestIds(mapping.tests),
      findPackageIds(mapping.packages),
    ]);
    if (testIds.length + packageIds.length === 0) {
      console.log(`MAP ! ${concern} — nothing matched in this catalogue, not created`);
      continue;
    }
    if (DRY_RUN) {
      console.log(
        `MAP (dry) ${concern} (${testIds.length}/${mapping.tests.length} tests, ${packageIds.length}/${mapping.packages.length} packages)`,
      );
      continue;
    }
    await prisma.concernTestMapping.create({
      data: {
        concern,
        keywords: mapping.keywords,
        testIds,
        packageIds,
        notes: `${MARK}. ${mapping.notes}`.trim(),
        isActive: false,
      },
    });
    console.log(`MAP + ${concern} (${testIds.length} tests, ${packageIds.length} packages)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
