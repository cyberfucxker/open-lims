import path from "path";
import PDFDocument from "pdfkit";
import { LAB_INFO } from "../constants/lab.constants";
import { amountToWords } from "../utils/numberToWords";
import { generateBarcodeDataUri } from "./barcode.service";
import type { BillDetails, BillListItem } from "../types/bill.types";
import type { FinanceReportGroupBy, FinanceReportResult } from "../types/financeReport.types";
import type { ExpenseListItem } from "../types/expense.types";

const LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");

function dataUriToBuffer(dataUri: string): Buffer {
  const base64 = dataUri.split(",")[1] ?? "";
  return Buffer.from(base64, "base64");
}

function formatCurrency(value: number): string {
  return `Rs. ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Renders the Invoice Cum Receipt PDF for a bill: logo, lab info, patient/
 *  appointment identity, tests table, billing summary, amount in words,
 *  barcode and a cashier-signature footer — the order specified for the
 *  Billing & Invoice module. Returns the finished document as a Buffer so the
 *  controller can stream it with either an inline or attachment disposition. */
export async function generateInvoicePdf(bill: BillDetails): Promise<Buffer> {
  const barcodeDataUri = await generateBarcodeDataUri(bill.appointmentNo);
  const barcodeBuffer = dataUriToBuffer(barcodeDataUri);

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // Header: logo + lab info
  try {
    doc.image(LOGO_PATH, 40, 40, { width: 140 });
  } catch {
    doc.fontSize(18).font("Helvetica-Bold").text(LAB_INFO.name, 40, 40);
  }
  doc
    .fontSize(9)
    .font("Helvetica")
    .text(LAB_INFO.address, 200, 42, { width: 350, align: "right" })
    .text(`Phone: ${LAB_INFO.phone}  |  Email: ${LAB_INFO.email}`, 200, 56, {
      width: 350,
      align: "right",
    });

  doc.moveDown(3);
  doc.fontSize(14).font("Helvetica-Bold").text("Invoice Cum Receipt", 40, 110, { align: "center" });

  // Invoice / patient identity block
  const infoTop = 140;
  const leftX = 40;
  const rightX = 320;
  doc.fontSize(9).font("Helvetica");

  const leftRows: [string, string][] = [
    ["Invoice No", bill.billNo],
    ["Appointment No", bill.appointmentNo],
    ["Patient ID", bill.patient.patientId],
    ["Patient Name", bill.patient.fullName],
    ["Age / Gender", `${bill.patient.age}Y / ${bill.patient.gender}`],
    ["Mobile", bill.patient.mobile],
  ];
  const rightRows: [string, string][] = [
    ["Invoice Date", formatDate(bill.createdAt)],
    ["Appointment Date", formatDate(bill.appointmentDate)],
    ["Referral Doctor", bill.patient.referral || "--"],
    ["Organization / B2B", bill.patient.organization || "--"],
    ["Payment Mode", bill.paymentMode],
    ["Emergency", bill.isEmergency ? "Yes" : "No"],
  ];

  leftRows.forEach(([label, value], i) => {
    doc
      .font("Helvetica-Bold")
      .text(`${label}:`, leftX, infoTop + i * 16, { continued: true, width: 260 });
    doc.font("Helvetica").text(` ${value}`);
  });
  rightRows.forEach(([label, value], i) => {
    doc
      .font("Helvetica-Bold")
      .text(`${label}:`, rightX, infoTop + i * 16, { continued: true, width: 230 });
    doc.font("Helvetica").text(` ${value}`);
  });

  // Tests table
  let y = infoTop + leftRows.length * 16 + 20;
  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Test Code", leftX, y, { width: 100 });
  doc.text("Test Name", leftX + 100, y, { width: 300 });
  doc.text("Price", leftX + 400, y, { width: 100, align: "right" });
  y += 16;
  doc.moveTo(leftX, y).lineTo(555, y).stroke();
  y += 6;

  doc.font("Helvetica").fontSize(9);
  bill.tests.forEach((test) => {
    doc.text(test.testCode, leftX, y, { width: 100 });
    doc.text(test.testName, leftX + 100, y, { width: 300 });
    doc.text(formatCurrency(test.price), leftX + 400, y, { width: 100, align: "right" });
    y += 16;
  });

  y += 6;
  doc.moveTo(leftX, y).lineTo(555, y).stroke();
  y += 10;

  // Billing summary
  const summaryRows: [string, string][] = [
    ["Subtotal", formatCurrency(bill.subtotal)],
    ["Discount", `- ${formatCurrency(bill.discountAmount)}`],
    ["Additional Charges", formatCurrency(bill.additionalCharges)],
    ["Net Amount", formatCurrency(bill.netAmount)],
    ["Paid Amount", formatCurrency(bill.amountPaid)],
    ["Due Amount", formatCurrency(bill.dueAmount)],
  ];
  const summaryLabelX = leftX + 300;
  const summaryValueX = leftX + 420;
  const rowHeight = 18;
  summaryRows.forEach(([label, value], i) => {
    const isNet = label === "Net Amount";
    const rowY = y + i * rowHeight;
    doc.font(isNet ? "Helvetica-Bold" : "Helvetica").fontSize(isNet ? 11 : 9.5);
    doc.text(label, summaryLabelX, rowY, { width: 120 });
    doc.text(value, summaryValueX, rowY, { width: 95, align: "right" });
  });
  y += summaryRows.length * rowHeight + 10;

  doc
    .font("Helvetica-Oblique")
    .fontSize(9)
    .text(`Amount In Words: ${amountToWords(bill.netAmount)}`, leftX, y, {
      width: 515,
    });
  y += 30;

  // Barcode + signature
  doc.image(barcodeBuffer, leftX, y, { width: 180 });
  doc
    .font("Helvetica")
    .fontSize(9)
    .text("Cashier Signature: ____________________", 350, y + 40);

  doc
    .fontSize(8)
    .fillColor("#666666")
    .text("Please bring this bill to collect your reports.", 40, 780, {
      align: "center",
      width: 515,
    });

  doc.end();
  return done;
}

/** Renders a simple tabular PDF of the filtered Bill List (Export PDF) — a
 *  different document from the single-invoice PDF above. */
export async function generateBillListPdf(bills: BillListItem[]): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(14).font("Helvetica-Bold").text(`${LAB_INFO.name} — Bill List`, { align: "center" });
  doc.moveDown(0.5);

  const columns = [
    { label: "Bill No", width: 80 },
    { label: "Patient", width: 140 },
    { label: "Appt No", width: 80 },
    { label: "Status", width: 70 },
    { label: "Net", width: 70 },
    { label: "Paid", width: 70 },
    { label: "Due", width: 70 },
    { label: "Date", width: 100 },
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
  bills.forEach((bill) => {
    if (y > 560) {
      doc.addPage();
      y = 40;
    }
    x = startX;
    const cells = [
      bill.billNo,
      bill.patient.fullName,
      bill.appointmentNo,
      bill.paymentStatus,
      formatCurrency(bill.netAmount),
      formatCurrency(bill.amountPaid),
      formatCurrency(bill.dueAmount),
      formatDate(bill.createdAt),
    ];
    cells.forEach((cell, i) => {
      doc.text(String(cell), x, y, { width: columns[i].width });
      x += columns[i].width;
    });
    y += 16;
  });

  doc.end();
  return done;
}

/** Renders the Finance Report PDF — a "By Date Wise" row-level table, or a
 *  group-summary table for the Organisation/Referral-wise tabs — same
 *  landscape/tabular layout convention as `generateBillListPdf` above. */
export async function generateFinanceReportPdf(
  result: FinanceReportResult,
  groupBy: FinanceReportGroupBy,
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text(`${LAB_INFO.name} — Finance Report`, { align: "center" });
  doc.moveDown(0.5);

  const startX = 30;
  let y = doc.y + 10;

  const columns =
    groupBy === "date"
      ? [
          { label: "Invoice No", width: 90 },
          { label: "Name", width: 130 },
          { label: "Receipt Date", width: 110 },
          { label: "Gross", width: 60 },
          { label: "Net", width: 60 },
          { label: "Paid", width: 60 },
          { label: "Discount", width: 60 },
          { label: "Due", width: 60 },
          { label: "Organization", width: 110 },
          { label: "Doctor", width: 110 },
        ]
      : [
          { label: groupBy === "organisation" ? "Organisation" : "Referral", width: 200 },
          { label: "Bills", width: 60 },
          { label: "Net Amount", width: 100 },
          { label: "Collection", width: 100 },
          { label: "Discount", width: 100 },
          { label: "Due", width: 100 },
        ];

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
  const rowsToRender: string[][] =
    groupBy === "date"
      ? result.rows.map((row) => [
          row.billNo,
          row.patientName,
          row.receiptDate ? formatDate(row.receiptDate) : "--",
          formatCurrency(row.grossTotal),
          formatCurrency(row.netAmount),
          formatCurrency(row.paidAmount),
          formatCurrency(row.discountAmount),
          formatCurrency(row.dueAmount),
          row.organization ?? "N/A",
          row.doctor ?? "N/A",
        ])
      : result.groups.map((group) => [
          group.name,
          String(group.billCount),
          formatCurrency(group.netAmount),
          formatCurrency(group.collectionAmount),
          formatCurrency(group.discountAmount),
          formatCurrency(group.dueAmount),
        ]);

  rowsToRender.forEach((cells) => {
    if (y > 560) {
      doc.addPage();
      y = 40;
    }
    x = startX;
    cells.forEach((cell, i) => {
      doc.text(cell, x, y, { width: columns[i].width });
      x += columns[i].width;
    });
    y += 16;
  });

  doc.end();
  return done;
}

/** Renders the Expenses (Service Invoice) List PDF — same tabular layout
 *  convention as `generateBillListPdf`/`generateFinanceReportPdf` above. */
export async function generateExpenseListPdf(expenses: ExpenseListItem[]): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(14).font("Helvetica-Bold").text(`${LAB_INFO.name} — Expenses`, { align: "center" });
  doc.moveDown(0.5);

  const columns = [
    { label: "Date", width: 80 },
    { label: "Category", width: 120 },
    { label: "Particular's", width: 150 },
    { label: "Qty", width: 50 },
    { label: "Rate", width: 70 },
    { label: "Amount", width: 70 },
    { label: "Payment Mode", width: 90 },
    { label: "Remarks", width: 150 },
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
  expenses.forEach((expense) => {
    if (y > 560) {
      doc.addPage();
      y = 40;
    }
    x = startX;
    const cells = [
      new Date(expense.invoiceDate).toLocaleDateString("en-IN"),
      expense.categoryName,
      expense.serviceName,
      String(expense.quantity),
      formatCurrency(expense.rate),
      formatCurrency(expense.amount),
      expense.paymentMode,
      expense.remarks ?? "--",
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
