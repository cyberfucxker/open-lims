import PDFDocument from "pdfkit";
import { generateBarcodeDataUri } from "./barcode.service";
import type { SampleRecord } from "../types/sample.types";

const LABEL_WIDTH = 288; // 4in @ 72pt/in
const LABEL_HEIGHT = 144; // 2in @ 72pt/in

function dataUriToBuffer(dataUri: string): Buffer {
  const base64 = dataUri.split(",")[1] ?? "";
  return Buffer.from(base64, "base64");
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

/** Renders one tube-label-sized page (4in x 2in): patient identity, sample
 *  no/type, container color swatch and the Code128 barcode — the same
 *  `generateBarcodeDataUri` used by the invoice PDF. */
async function drawLabel(
  doc: PDFKit.PDFDocument,
  sample: SampleRecord,
  addPage: boolean,
): Promise<void> {
  if (addPage) {
    doc.addPage({ size: [LABEL_WIDTH, LABEL_HEIGHT], margin: 8 });
  }

  const barcodeBuffer = dataUriToBuffer(await generateBarcodeDataUri(sample.sampleNo));

  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .text(sample.patient.fullName, 8, 8, { width: LABEL_WIDTH - 16 });
  doc
    .fontSize(7)
    .font("Helvetica")
    .text(`${sample.patient.patientId} | ${sample.patient.age}Y/${sample.patient.gender}`, 8, 19, {
      width: LABEL_WIDTH - 16,
    });
  doc.text(
    `${sample.sampleType}${sample.containerName ? ` (${sample.containerName})` : ""}`,
    8,
    30,
    {
      width: LABEL_WIDTH - 16,
    },
  );

  if (sample.containerColor) {
    doc.rect(LABEL_WIDTH - 24, 8, 12, 12).fill(sample.containerColor);
    doc.fillColor("black");
  }

  doc.image(barcodeBuffer, 8, 44, { width: LABEL_WIDTH - 16, height: 56 });

  // Fixed height + no line-break/ellipsis growth so this last line can never
  // push pdfkit's automatic pagination into adding a trailing blank page —
  // labels are always exactly one page.
  doc
    .fontSize(6)
    .font("Helvetica")
    .text(`Collected: ${formatDate(sample.collectedAt)}`, 8, 116, {
      width: LABEL_WIDTH - 16,
      height: 12,
      lineBreak: false,
      ellipsis: true,
    });
}

export async function generateSampleLabelPdf(sample: SampleRecord): Promise<Buffer> {
  const doc = new PDFDocument({ size: [LABEL_WIDTH, LABEL_HEIGHT], margin: 8 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  await drawLabel(doc, sample, false);

  doc.end();
  return done;
}

export async function generateSampleLabelBatchPdf(samples: SampleRecord[]): Promise<Buffer> {
  const doc = new PDFDocument({
    size: [LABEL_WIDTH, LABEL_HEIGHT],
    margin: 8,
    autoFirstPage: false,
  });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  for (const sample of samples) {
    await drawLabel(doc, sample, true);
  }

  doc.end();
  return done;
}
