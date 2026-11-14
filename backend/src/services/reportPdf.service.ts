import path from "path";
import PDFDocument from "pdfkit";
import * as bwipjs from "bwip-js";
import { LAB_INFO } from "../constants/lab.constants";
import { generateBarcodeDataUri } from "./barcode.service";
import { getReportSettings } from "./reportSettings.service";
import { UPLOADS_DIR } from "../middleware/upload.middleware";
import type { ReportDetails } from "../types/report.types";
import type { ReportSettingsDto, ReportSettingsWriteData } from "../types/reportSettings.types";

const DEFAULT_LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");

/** Realistic fixture used by both the Report Designer's live preview and
 *  "Download Sample PDF" — never touches the database, so the preview is
 *  instant and independent of what real reports currently exist. */
export const SAMPLE_REPORT: ReportDetails = {
  id: "sample",
  reportNo: "RPT000000",
  appointmentId: "sample",
  appointmentNo: "APT000000",
  billNo: "INV000000",
  patient: {
    id: "sample",
    patientId: "LAB000000",
    fullName: "John Doe",
    mobile: "9876543210",
    gender: "Male",
    age: 34,
  },
  status: "APPROVED",
  isEmergency: false,
  tests: [],
  testResults: [],
  enteredByUserId: null,
  enteredAt: new Date().toISOString(),
  approvedByUserId: null,
  approvedAt: new Date().toISOString(),
  submittedAt: new Date().toISOString(),
  printCount: 0,
  lastPrintedAt: null,
  cancelReason: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  results: [
    {
      id: "1",
      appointmentTestId: "1",
      testId: "1",
      testName: "Hemoglobin",
      testShortName: "HB",
      departmentName: "Biochemistry",
      sampleId: "1",
      sampleNo: "BLD000001",
      sampleStatus: "RECEIVED",
      resultValue: "13.5",
      unit: "g/dL",
      referenceRange: "13.0 - 17.0",
      method: "Photometry",
      remarks: null,
      flag: "NORMAL",
      isCritical: false,
      enteredByUserId: null,
      enteredAt: new Date().toISOString(),
      status: "APPROVED",
      submittedAt: new Date().toISOString(),
      approvedByUserId: null,
      approvedAt: new Date().toISOString(),
      rejectedAt: null,
      rejectReason: null,
      printedAt: null,
      signatoryIds: [],
      parameters: [],
    },
    {
      id: "2",
      appointmentTestId: "2",
      testId: "2",
      testName: "Fasting Blood Sugar",
      testShortName: "FBS",
      departmentName: "Biochemistry",
      sampleId: "1",
      sampleNo: "BLD000001",
      sampleStatus: "RECEIVED",
      resultValue: "126",
      unit: "mg/dL",
      referenceRange: "70 - 100",
      method: "GOD-POD",
      remarks: "Repeat after 3 months",
      flag: "HIGH",
      isCritical: false,
      enteredByUserId: null,
      enteredAt: new Date().toISOString(),
      status: "APPROVED",
      submittedAt: new Date().toISOString(),
      approvedByUserId: null,
      approvedAt: new Date().toISOString(),
      rejectedAt: null,
      rejectReason: null,
      printedAt: null,
      signatoryIds: [],
      parameters: [],
    },
    {
      id: "3",
      appointmentTestId: "3",
      testId: "3",
      testName: "Serum Potassium",
      testShortName: "K+",
      departmentName: "Biochemistry",
      sampleId: "1",
      sampleNo: "BLD000001",
      sampleStatus: "RECEIVED",
      resultValue: "6.8",
      unit: "mmol/L",
      referenceRange: "3.5 - 5.1",
      method: "ISE",
      remarks: "Critically high — physician notified",
      flag: "CRITICAL_HIGH",
      isCritical: true,
      enteredByUserId: null,
      enteredAt: new Date().toISOString(),
      status: "APPROVED",
      submittedAt: new Date().toISOString(),
      approvedByUserId: null,
      approvedAt: new Date().toISOString(),
      rejectedAt: null,
      rejectReason: null,
      printedAt: null,
      signatoryIds: [],
      parameters: [],
    },
    {
      id: "4",
      appointmentTestId: "4",
      testId: "4",
      testName: "Total Cholesterol",
      testShortName: "CHOL",
      departmentName: "Biochemistry",
      sampleId: "1",
      sampleNo: "BLD000001",
      sampleStatus: "RECEIVED",
      resultValue: "185",
      unit: "mg/dL",
      referenceRange: "< 200",
      method: "Enzymatic",
      remarks: null,
      flag: "NORMAL",
      isCritical: false,
      enteredByUserId: null,
      enteredAt: new Date().toISOString(),
      status: "APPROVED",
      submittedAt: new Date().toISOString(),
      approvedByUserId: null,
      approvedAt: new Date().toISOString(),
      rejectedAt: null,
      rejectReason: null,
      printedAt: null,
      signatoryIds: [],
      parameters: [],
    },
  ],
};

function dataUriToBuffer(dataUri: string): Buffer {
  const base64 = dataUri.split(",")[1] ?? "";
  return Buffer.from(base64, "base64");
}

function resolveAssetPath(assetPath: string | null): string | null {
  if (!assetPath) return null;
  return path.join(UPLOADS_DIR, path.basename(assetPath));
}

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function generateQrDataUri(text: string): Promise<string> {
  const png = await bwipjs.toBuffer({ bcid: "qrcode", text, scale: 3 });
  return `data:image/png;base64,${png.toString("base64")}`;
}

function flagLabel(flag: string): string {
  switch (flag) {
    case "LOW":
      return "L";
    case "HIGH":
      return "H";
    case "CRITICAL_LOW":
      return "LL";
    case "CRITICAL_HIGH":
      return "HH";
    default:
      return "";
  }
}

const BARCODE_WIDTH = 140;
const BARCODE_HEIGHT = 40;
const PAGE_HEIGHT_ESTIMATE = 792; // A4 height in points; LETTER is close enough for bottom-position math

function barcodePosition(settings: ReportSettingsDto, pageWidth: number): { x: number; y: number } {
  const top = settings.marginTop + 10;
  const bottom = PAGE_HEIGHT_ESTIMATE - settings.marginBottom - BARCODE_HEIGHT - 10;
  const left = settings.marginLeft;
  const right = pageWidth - settings.marginRight - BARCODE_WIDTH;

  switch (settings.barcodePosition) {
    case "TOP_LEFT":
      return { x: left, y: top };
    case "BOTTOM_LEFT":
      return { x: left, y: bottom };
    case "BOTTOM_RIGHT":
      return { x: right, y: bottom };
    default:
      return { x: right, y: top };
  }
}

interface ResultColumn {
  label: string;
  width: number;
  getValue: (result: ReportDetails["results"][number], flagSuffix: string) => string;
}

/** Test Name + Result are always shown; the rest follow `reportFields`,
 *  with the remaining width redistributed across whichever are enabled. */
const OPTIONAL_RESULT_COLUMNS: {
  key: "unit" | "referenceRange" | "method";
  label: string;
  weight: number;
}[] = [
  { key: "unit", label: "Unit", weight: 0.12 },
  { key: "referenceRange", label: "Reference Range", weight: 0.23 },
  { key: "method", label: "Method", weight: 0.2 },
];

function buildResultColumns(settings: ReportSettingsDto, contentWidth: number): ResultColumn[] {
  const optional = OPTIONAL_RESULT_COLUMNS.filter((c) => settings.reportFields[c.key]);

  const fixedWeight = 0.3 + 0.15; // Test Name + Result
  const optionalWeight = optional.reduce((sum, c) => sum + c.weight, 0);
  const scale = optionalWeight > 0 ? (1 - fixedWeight) / optionalWeight : 0;

  return [
    { label: "Test Name", width: contentWidth * 0.3, getValue: (r) => r.testName },
    {
      label: "Result",
      width: contentWidth * 0.15,
      getValue: (r, flagSuffix) =>
        `${r.resultValue ?? "--"}${flagSuffix ? ` (${flagSuffix})` : ""}`,
    },
    ...optional.map((c) => ({
      label: c.label,
      width: contentWidth * c.weight * scale,
      getValue: (r: ReportDetails["results"][number]) => r[c.key] ?? "--",
    })),
  ];
}

/** Draws one report's full letterhead-styled content (watermark, header,
 *  patient block, results table, barcode/QR, signature, footer) onto a page
 *  the caller has already added — the one function `renderReportPdf` (single
 *  report), the Report Designer preview, and the combined per-test PDF (see
 *  `generateCombinedTestResultsPdf`) all delegate to, so none of them can
 *  drift from what the others render. Does NOT touch page numbering or
 *  `doc.end()` — those run once, after every page across the whole document
 *  has been drawn (see each caller). */
async function drawReportContent(
  doc: PDFKit.PDFDocument,
  report: ReportDetails,
  settings: ReportSettingsDto,
): Promise<void> {
  const pageWidth = doc.page.width;
  const contentLeft = settings.marginLeft;
  const contentWidth = pageWidth - settings.marginLeft - settings.marginRight;
  const primaryColor = settings.primaryColor || "#0B1E39";

  // Watermark — anchored a bit below true page-center (not exactly
  // page.height/2) so it sits in the page's lower-middle blank area rather
  // than behind the header/patient-details/test-table, which all cluster in
  // the upper half of the page.
  const watermarkCenterY = doc.page.height / 2 + 80;
  if (settings.watermarkMode === "IMAGE" && settings.watermarkImagePath) {
    const imgPath = resolveAssetPath(settings.watermarkImagePath);
    try {
      doc.save();
      doc.opacity(0.12);
      const size = Math.min(pageWidth, doc.page.height) * 0.6;
      doc.image(imgPath as string, (pageWidth - size) / 2, watermarkCenterY - size / 2, {
        width: size,
        height: size,
      });
      doc.restore();
    } catch {
      /* corrupt/missing watermark image — skip silently, rest of the report still renders */
    }
  } else if (settings.watermarkMode === "TEXT" && settings.watermarkText) {
    doc.save();
    doc.rotate(-45, { origin: [pageWidth / 2, watermarkCenterY] });
    doc
      .fontSize(60)
      .fillColor("#eeeeee")
      .text(settings.watermarkText, 0, watermarkCenterY - 30, {
        width: pageWidth,
        align: "center",
      });
    doc.restore();
    doc.fillColor("black");
  }

  // Header: image takes priority over logo+lab text when provided. Lab
  // name/header text are always drawn next to the logo — previously they
  // were only drawn when the logo image failed to load, which meant typing
  // a Lab Name never visibly changed anything as long as any logo (even the
  // built-in default) was present. Lab Name itself is intentionally NOT
  // repeated here — it already sits between the QR code and the barcode
  // (both anchored top-right by default), which is redundant with the big
  // centered "{labName} Laboratory Report" title below and reads as clutter
  // in that corner. It stays in that title only.
  const headerImage = resolveAssetPath(settings.headerImagePath);
  if (headerImage) {
    try {
      doc.image(headerImage, contentLeft, settings.marginTop, { width: contentWidth });
    } catch {
      /* fall through to logo+text below */
    }
  } else {
    try {
      doc.image(
        resolveAssetPath(settings.logoPath) ?? DEFAULT_LOGO_PATH,
        contentLeft,
        settings.marginTop,
        { width: 140 },
      );
    } catch {
      /* no logo available — header text below still renders */
    }
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("black")
      .text(settings.headerText ?? LAB_INFO.address, contentLeft + 160, settings.marginTop, {
        width: contentWidth - 160,
        align: "right",
      });
  }

  doc
    .fontSize(settings.fontSize + 5)
    .font("Helvetica-Bold")
    .fillColor(primaryColor)
    .text(
      `${settings.labName ?? LAB_INFO.name} Laboratory Report`,
      contentLeft,
      settings.marginTop + 60,
      {
        align: "center",
        width: contentWidth,
      },
    );
  doc.fillColor("black");

  // Patient / appointment / doctor identity block — filtered by patientFields
  const infoTop = settings.marginTop + 90;
  const rightX = contentLeft + contentWidth / 2;
  doc.fontSize(settings.fontSize).font("Helvetica");

  const leftRows: [string, string][] = [
    ["Report No", report.reportNo],
    ["Appointment No", report.appointmentNo],
    ["Patient Name", report.patient.fullName],
  ];
  if (settings.patientFields.patientId) leftRows.push(["Patient ID", report.patient.patientId]);
  if (settings.patientFields.ageGender)
    leftRows.push(["Age / Gender", `${report.patient.age}Y / ${report.patient.gender}`]);
  if (settings.patientFields.mobile) leftRows.push(["Mobile", report.patient.mobile]);

  const rightRows: [string, string][] = [];
  if (settings.patientFields.billNo) rightRows.push(["Bill No", report.billNo ?? "--"]);
  if (settings.patientFields.reportDate)
    rightRows.push(["Report Date", formatDate(report.createdAt)]);
  if (settings.patientFields.approvedDate)
    rightRows.push(["Approved Date", formatDate(report.approvedAt)]);
  if (settings.patientFields.emergency)
    rightRows.push(["Emergency", report.isEmergency ? "Yes" : "No"]);
  if (settings.patientFields.status) rightRows.push(["Status", report.status]);

  leftRows.forEach(([label, value], i) => {
    doc
      .font("Helvetica-Bold")
      .text(`${label}:`, contentLeft, infoTop + i * 15, { continued: true, width: 220 });
    doc.font("Helvetica").text(` ${value}`);
  });
  rightRows.forEach(([label, value], i) => {
    doc
      .font("Helvetica-Bold")
      .text(`${label}:`, rightX, infoTop + i * 15, { continued: true, width: 200 });
    doc.font("Helvetica").text(` ${value}`);
  });

  // Results table — columns driven by reportFields
  const rowHeight = 16 * settings.lineSpacing;
  let y = infoTop + Math.max(leftRows.length, rightRows.length) * 15 + 20;
  const columns = buildResultColumns(settings, contentWidth);

  doc
    .font("Helvetica-Bold")
    .fontSize(settings.fontSize + 1)
    .fillColor(primaryColor);
  let x = contentLeft;
  columns.forEach((col) => {
    doc.text(col.label, x, y, { width: col.width });
    x += col.width;
  });
  y += 16;
  doc
    .strokeColor(primaryColor)
    .moveTo(contentLeft, y)
    .lineTo(contentLeft + contentWidth, y)
    .stroke();
  doc.strokeColor("black").fillColor("black");
  y += 6;

  doc.font("Helvetica").fontSize(settings.fontSize);
  const bottomLimit = doc.page.height - settings.marginBottom - 100;
  report.results.forEach((result) => {
    if (y > bottomLimit) {
      doc.addPage();
      y = settings.marginTop;
    }
    x = contentLeft;
    const flagSuffix = settings.reportFields.flag ? flagLabel(result.flag) : "";
    if (result.isCritical) doc.fillColor("#c0392b");
    columns.forEach((col) => {
      doc.text(col.getValue(result, flagSuffix), x, y, { width: col.width });
      x += col.width;
    });
    doc.fillColor("black");
    if (settings.reportFields.remarks && result.remarks) {
      y += 13;
      doc
        .font("Helvetica-Oblique")
        .fontSize(settings.fontSize - 1)
        .text(`Remarks: ${result.remarks}`, contentLeft, y, { width: contentWidth });
      doc.font("Helvetica").fontSize(settings.fontSize);
    }
    y += rowHeight;
  });

  // Barcode + QR
  if (settings.showBarcode) {
    const barcodeBuffer = dataUriToBuffer(await generateBarcodeDataUri(report.reportNo));
    const { x: bx, y: by } = barcodePosition(settings, pageWidth);
    doc.image(barcodeBuffer, bx, by, { width: BARCODE_WIDTH, height: BARCODE_HEIGHT });

    if (settings.showQrCode) {
      const qrBuffer = dataUriToBuffer(
        await generateQrDataUri(`${report.reportNo}|${report.appointmentNo}`),
      );
      doc.image(qrBuffer, bx + BARCODE_WIDTH - 40, by - 50, { width: 40, height: 40 });
    }
  }

  // Signature
  if (settings.showSignature) {
    const signatureImage = resolveAssetPath(settings.signaturePath);
    if (signatureImage) {
      try {
        doc.image(signatureImage, rightX, y + 8, { width: 100, height: 30 });
      } catch {
        /* missing/corrupt signature image — the labeled line below still renders */
      }
    }
    doc.fontSize(settings.fontSize).text("Verified By: ____________________", contentLeft, y + 40);
    doc.text("Approved By: ____________________", rightX, y + 40);
  }

  // Footer: image takes priority over text when provided
  if (settings.showFooter) {
    const footerImage = resolveAssetPath(settings.footerImagePath);
    const footerY = doc.page.height - settings.marginBottom - (footerImage ? 24 : 10);
    if (footerImage) {
      try {
        doc.image(footerImage, contentLeft, footerY - 20, {
          width: contentWidth,
          height: 20,
          fit: [contentWidth, 20],
          align: "center",
        });
      } catch {
        /* fall through to text */
      }
    } else if (settings.footerText) {
      // Explicit height (clipped with an ellipsis rather than wrapping
      // freely) keeps this intentionally-near-the-page-edge text from
      // tripping PDFKit's automatic page-break, which otherwise silently
      // appends a blank trailing page.
      doc
        .fontSize(settings.fontSize - 1)
        .fillColor("#666666")
        .text(settings.footerText, contentLeft, footerY, {
          align: "center",
          width: contentWidth,
          height: doc.page.height - footerY - 4,
          ellipsis: true,
        });
      doc.fillColor("black");
    }
  }
}

/** Draws "Page X of N | Generated: ..." on every buffered page — run once,
 *  after all content across the whole document has been drawn, since N only
 *  becomes known at that point. Requires the doc to have been created with
 *  `bufferPages: true`. */
function drawPageNumbers(doc: PDFKit.PDFDocument, settings: ReportSettingsDto): void {
  if (!settings.showPageNumber) return;

  const contentLeft = settings.marginLeft;
  const contentWidth = doc.page.width - settings.marginLeft - settings.marginRight;
  const pageRange = doc.bufferedPageRange();
  for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(7)
      .fillColor("#999999")
      .text(
        `Page ${i + 1} of ${pageRange.count} | Generated: ${formatDate(new Date().toISOString())}`,
        contentLeft,
        doc.page.height - settings.marginBottom + 2,
        {
          width: contentWidth,
          height: 12,
          align: "center",
          lineBreak: false,
        },
      );
    doc.fillColor("black");
  }
}

/** Renders the Report PDF from an already-resolved settings object — the one
 *  function both real report generation and the Report Designer's live
 *  preview call, so the preview can never drift from the final PDF. */
export async function renderReportPdf(
  report: ReportDetails,
  settings: ReportSettingsDto,
): Promise<Buffer> {
  const pageSize = settings.pageSize === "LETTER" ? "LETTER" : "A4";

  const doc = new PDFDocument({
    size: pageSize,
    margins: {
      top: settings.marginTop,
      right: settings.marginRight,
      bottom: settings.marginBottom,
      left: settings.marginLeft,
    },
    // Required for the page-number loop below: bufferedPageRange()/
    // switchToPage() silently append a stray blank page when the document
    // isn't buffering pages, which was turning every single-page report
    // into a spurious 2-page PDF.
    bufferPages: true,
  });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  await drawReportContent(doc, report, settings);
  drawPageNumbers(doc, settings);

  doc.end();
  return done;
}

/** Real report generation — fetches the saved settings, then delegates to
 *  the same renderer the Report Designer preview uses. */
export async function generateReportPdf(report: ReportDetails): Promise<Buffer> {
  const settings = await getReportSettings();
  return renderReportPdf(report, settings);
}

const NUMERIC_OVERRIDE_KEYS = [
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "lineSpacing",
  "fontSize",
] as const;

/** Strips numeric override fields that are empty/NaN — the live preview
 *  fires on every keystroke, so while a user is retyping a margin/font-size
 *  value the field is briefly "" (or NaN, which the browser JSON-serializes
 *  as null). Those must fall back to the saved value rather than being
 *  merged in literally (a `marginTop: ""` would go straight into PDFKit,
 *  which needs an actual number). Text/boolean/enum fields are untouched —
 *  e.g. an explicit empty string is a legitimate "clear this text" override. */
function sanitizeNumericOverrides(overrides: ReportSettingsWriteData): ReportSettingsWriteData {
  const sanitized = { ...overrides };
  for (const key of NUMERIC_OVERRIDE_KEYS) {
    const value = sanitized[key];
    if (value === null || value === undefined || typeof value !== "number" || Number.isNaN(value)) {
      delete sanitized[key];
    }
  }
  return sanitized;
}

/** Report Designer live preview / "Download Sample PDF" — merges the
 *  in-progress (possibly unsaved) form values over the saved settings and
 *  renders the shared `SAMPLE_REPORT` fixture through the exact same
 *  `renderReportPdf`, so what's previewed is guaranteed to match a real PDF
 *  rendered with those settings. */
export async function generateReportPreviewPdf(
  rawOverrides: ReportSettingsWriteData,
): Promise<Buffer> {
  const saved = await getReportSettings();
  const overrides = sanitizeNumericOverrides(rawOverrides);
  const merged: ReportSettingsDto = {
    ...saved,
    ...overrides,
    patientFields: { ...saved.patientFields, ...overrides.patientFields },
    reportFields: { ...saved.reportFields, ...overrides.reportFields },
  };
  return renderReportPdf(SAMPLE_REPORT, merged);
}

/** Group Print: renders every report directly onto one shared document
 *  (pdfkit has no native "append an existing finished PDF" API, so each
 *  report is drawn fresh rather than merging separate PDF byte streams).
 *  Settings are fetched once up front rather than per report in the loop. */
export async function generateReportBatchPdf(reports: ReportDetails[]): Promise<Buffer> {
  const settings = await getReportSettings();

  const doc = new PDFDocument({ autoFirstPage: false });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  for (const report of reports) {
    renderReportOntoDoc(doc, report, settings);
  }

  doc.end();
  return done;
}

function renderReportOntoDoc(
  doc: PDFKit.PDFDocument,
  report: ReportDetails,
  settings: ReportSettingsDto,
): void {
  doc.addPage({
    size: settings.pageSize === "LETTER" ? "LETTER" : "A4",
    margins: {
      top: settings.marginTop,
      right: settings.marginRight,
      bottom: settings.marginBottom,
      left: settings.marginLeft,
    },
  });

  const contentLeft = settings.marginLeft;
  const contentWidth = doc.page.width - settings.marginLeft - settings.marginRight;

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(
      `${settings.labName ?? LAB_INFO.name} — Report ${report.reportNo}`,
      contentLeft,
      settings.marginTop,
      {
        width: contentWidth,
      },
    );
  doc
    .fontSize(10)
    .font("Helvetica")
    .text(
      `Patient: ${report.patient.fullName} | Appointment: ${report.appointmentNo}`,
      contentLeft,
      settings.marginTop + 20,
    );

  let y = settings.marginTop + 50;
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Test Name", contentLeft, y, { width: contentWidth * 0.4 });
  doc.text("Result", contentLeft + contentWidth * 0.4, y, { width: contentWidth * 0.2 });
  doc.text("Reference Range", contentLeft + contentWidth * 0.6, y, { width: contentWidth * 0.4 });
  y += 16;
  doc.font("Helvetica").fontSize(9.5);

  report.results.forEach((result) => {
    if (y > doc.page.height - settings.marginBottom - 40) {
      doc.addPage();
      y = settings.marginTop;
    }
    doc.text(result.testName, contentLeft, y, { width: contentWidth * 0.4 });
    doc.text(result.resultValue ?? "--", contentLeft + contentWidth * 0.4, y, {
      width: contentWidth * 0.2,
    });
    doc.text(result.referenceRange ?? "--", contentLeft + contentWidth * 0.6, y, {
      width: contentWidth * 0.4,
    });
    y += 15;
  });
}

export interface CombinedPdfOptions {
  withLetterhead: boolean;
  withPageBreak: boolean;
  withDepartmentWise: boolean;
  withVitals: boolean;
}

/** `withLetterhead: false` strips branding (logo/header/footer) from a
 *  cloned settings object for this render only — never touches the saved
 *  Report Settings row. */
function applyLetterheadOverride(
  settings: ReportSettingsDto,
  withLetterhead: boolean,
): ReportSettingsDto {
  if (withLetterhead) return settings;
  return {
    ...settings,
    logoPath: null,
    headerImagePath: null,
    headerText: "",
    footerImagePath: null,
    footerText: null,
    showFooter: false,
  };
}

/** Stable sort by first-seen department order — groups a patient's selected
 *  tests by department without an arbitrary alphabetical reshuffle. */
function sortByDepartment(results: ReportDetails["results"]): ReportDetails["results"] {
  const order: string[] = [];
  for (const r of results) {
    if (!order.includes(r.departmentName)) order.push(r.departmentName);
  }
  return [...results].sort(
    (a, b) => order.indexOf(a.departmentName) - order.indexOf(b.departmentName),
  );
}

/** Combines a subset of one bill's APPROVED test results into a single PDF —
 *  the "Preview Selected Test" / combined download step, reached once every
 *  test in the selection has gone through the per-test approval workflow
 *  (see `report.service.ts#generateCombinedPdfForReport`, which validates the
 *  selection before calling this). Reuses `drawReportContent` entirely, so
 *  this can never visually drift from a normal single-report PDF.
 *
 *  `withPageBreak: true` (the reference product's default) puts one test per
 *  full letterhead-styled page. `false` instead renders every selected test
 *  as one continuous flowing report (identical shape to a whole-report PDF,
 *  just scoped to the selection), using the results table's normal
 *  row-overflow pagination.
 *
 *  `withVitals` is accepted for forward-compatibility but has no visual
 *  effect yet — patient vitals (BP/height/weight/etc.) aren't tracked
 *  anywhere in this codebase's data model, so there's nothing to render. */
export async function generateCombinedTestResultsPdf(
  report: ReportDetails,
  resultIds: string[],
  options: CombinedPdfOptions,
): Promise<Buffer> {
  const saved = await getReportSettings();
  const settings = applyLetterheadOverride(saved, options.withLetterhead);

  const selectedIds = new Set(resultIds);
  let selected = report.results.filter((r) => selectedIds.has(r.id) && r.status === "APPROVED");
  if (options.withDepartmentWise) selected = sortByDepartment(selected);

  const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const pageOptions = {
    size: (settings.pageSize === "LETTER" ? "LETTER" : "A4") as "LETTER" | "A4",
    margins: {
      top: settings.marginTop,
      right: settings.marginRight,
      bottom: settings.marginBottom,
      left: settings.marginLeft,
    },
  };

  if (options.withPageBreak) {
    for (const result of selected) {
      doc.addPage(pageOptions);
      await drawReportContent(doc, { ...report, results: [result] }, settings);
    }
  } else {
    doc.addPage(pageOptions);
    await drawReportContent(doc, { ...report, results: selected }, settings);
  }

  drawPageNumbers(doc, settings);
  doc.end();
  return done;
}
