import PDFDocument from "pdfkit";
import { LAB_INFO } from "../constants/lab.constants";
import type { OrganizationDto } from "../types/organization.types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Renders a simple tabular PDF of the filtered Organization List (Export
 *  PDF) — same landscape-table pattern as invoicePdf.service.ts#generateBillListPdf. */
export async function generateOrganizationListPdf(
  organizations: OrganizationDto[],
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
    .text(`${LAB_INFO.name} — Organization List`, { align: "center" });
  doc.moveDown(0.5);

  const columns = [
    { label: "Code", width: 70 },
    { label: "Name", width: 150 },
    { label: "Type", width: 100 },
    { label: "Contact Person", width: 110 },
    { label: "Mobile", width: 80 },
    { label: "City", width: 80 },
    { label: "Payment Type", width: 80 },
    { label: "Status", width: 60 },
    { label: "Created", width: 90 },
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
  organizations.forEach((org) => {
    if (y > 560) {
      doc.addPage();
      y = 40;
    }
    x = startX;
    const cells = [
      org.code,
      org.name,
      org.type === "GENERAL_CENTER" ? "General Center" : "Collection Center",
      org.contactPerson ?? "--",
      org.mobile,
      org.city ?? "--",
      org.paymentType,
      org.active ? "Active" : "Inactive",
      formatDate(org.createdAt),
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
