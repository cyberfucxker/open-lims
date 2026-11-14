import PDFDocument from "pdfkit";
import { LAB_INFO } from "../constants/lab.constants";
import type {
  ReferralSettlementDetailsDto,
  ReferralSettlementDto,
} from "../types/referralSettlement.types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function newDoc() {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
  return { doc, done };
}

/** Renders a simple tabular PDF of the filtered Referral Settlement List
 *  (Export PDF) — same landscape-table pattern as
 *  organizationPdf.service.ts#generateOrganizationListPdf. */
export async function generateReferralSettlementListPdf(
  settlements: ReferralSettlementDto[],
): Promise<Buffer> {
  const { doc, done } = newDoc();

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(`${LAB_INFO.name} — Referral Settlements`, { align: "center" });
  doc.moveDown(0.5);

  const columns = [
    { label: "Referral", width: 140 },
    { label: "From", width: 80 },
    { label: "To", width: 80 },
    { label: "Patients", width: 60 },
    { label: "Revenue", width: 80 },
    { label: "Commission %", width: 80 },
    { label: "Commission Amt", width: 90 },
    { label: "Adjustment", width: 80 },
    { label: "Final Amount", width: 90 },
    { label: "Status", width: 70 },
  ];
  const startX = 30;
  let y = doc.y + 10;

  doc.fontSize(9).font("Helvetica-Bold");
  let x = startX;
  columns.forEach((col) => {
    doc.text(col.label, x, y, { width: col.width });
    x += col.width;
  });
  y += 16;
  doc.moveTo(startX, y).lineTo(x, y).stroke();
  y += 6;

  doc.font("Helvetica").fontSize(8.5);
  settlements.forEach((settlement) => {
    if (y > 560) {
      doc.addPage();
      y = 40;
    }
    x = startX;
    const cells = [
      settlement.referralSourceName,
      settlement.fromDate,
      settlement.toDate,
      String(settlement.totalPatients),
      settlement.totalRevenue.toFixed(2),
      `${settlement.commissionPercentage}%`,
      settlement.commissionAmount.toFixed(2),
      settlement.adjustment.toFixed(2),
      settlement.finalAmount.toFixed(2),
      settlement.settlementStatus,
    ];
    cells.forEach((cell, i) => {
      doc.text(cell, x, y, { width: columns[i].width });
      x += columns[i].width;
    });
    y += 16;
  });

  doc.end();
  return done;
}

/** Renders a single-settlement PDF with its incentive line items — used by
 *  the row-level "Export PDF" action. */
export async function generateSingleReferralSettlementPdf(
  settlement: ReferralSettlementDetailsDto,
): Promise<Buffer> {
  const { doc, done } = newDoc();

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(`${LAB_INFO.name} — Referral Settlement`, { align: "center" });
  doc.moveDown(0.5);

  doc.fontSize(10).font("Helvetica-Bold").text(`Referral: ${settlement.referralSourceName}`);
  doc
    .font("Helvetica")
    .text(`Period: ${settlement.fromDate} to ${settlement.toDate}`)
    .text(`Status: ${settlement.settlementStatus}`)
    .text(
      settlement.paymentDate
        ? `Payment Date: ${formatDate(settlement.paymentDate)}`
        : "Payment Date: --",
    )
    .moveDown(0.5)
    .text(`Total Patients: ${settlement.totalPatients}`)
    .text(`Total Revenue: ${settlement.totalRevenue.toFixed(2)}`)
    .text(`Commission %: ${settlement.commissionPercentage}%`)
    .text(`Commission Amount: ${settlement.commissionAmount.toFixed(2)}`)
    .text(`Adjustment: ${settlement.adjustment.toFixed(2)}`)
    .font("Helvetica-Bold")
    .text(`Final Amount: ${settlement.finalAmount.toFixed(2)}`)
    .font("Helvetica");
  doc.moveDown(0.75);

  const columns = [
    { label: "Patient", width: 200 },
    { label: "Bill No", width: 120 },
    { label: "Bill Amount", width: 120 },
    { label: "Incentive Amount", width: 120 },
  ];
  const startX = 30;
  let y = doc.y + 5;

  doc.fontSize(9).font("Helvetica-Bold");
  let x = startX;
  columns.forEach((col) => {
    doc.text(col.label, x, y, { width: col.width });
    x += col.width;
  });
  y += 16;
  doc.moveTo(startX, y).lineTo(x, y).stroke();
  y += 6;

  doc.font("Helvetica").fontSize(8.5);
  settlement.incentives.forEach((line) => {
    if (y > 560) {
      doc.addPage();
      y = 40;
    }
    x = startX;
    const cells = [
      line.patientName,
      line.billNo,
      line.billAmount.toFixed(2),
      line.incentiveAmount.toFixed(2),
    ];
    cells.forEach((cell, i) => {
      doc.text(cell, x, y, { width: columns[i].width });
      x += columns[i].width;
    });
    y += 16;
  });

  doc.end();
  return done;
}
