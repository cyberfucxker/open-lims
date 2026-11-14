import ExcelJS from "exceljs";
import type { BillListItem } from "../types/bill.types";
import type { SampleRecord } from "../types/sample.types";
import type { ReportListItem } from "../types/report.types";
import type { OrganizationDto } from "../types/organization.types";
import type { MonthlyReportResult } from "../types/marketingReport.types";
import type { ReferralSettlementDto } from "../types/referralSettlement.types";
import type { FinanceReportGroupBy, FinanceReportResult } from "../types/financeReport.types";
import type { ExpenseListItem } from "../types/expense.types";

/** Builds the Bill List export workbook — same columns as the Bill List
 *  table — and returns it as a Buffer ready to stream as an .xlsx download. */
export async function generateBillListExcel(bills: BillListItem[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Bills");

  sheet.columns = [
    { header: "Bill No", key: "billNo", width: 16 },
    { header: "Appointment No", key: "appointmentNo", width: 16 },
    { header: "Patient Name", key: "patientName", width: 24 },
    { header: "Age", key: "age", width: 8 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Mobile", key: "mobile", width: 14 },
    { header: "Referral", key: "referral", width: 20 },
    { header: "B2B / Organization", key: "organization", width: 22 },
    { header: "Tests", key: "tests", width: 40 },
    { header: "Status", key: "status", width: 12 },
    { header: "Payment Status", key: "paymentStatus", width: 14 },
    { header: "Net Amount", key: "netAmount", width: 14 },
    { header: "Paid Amount", key: "amountPaid", width: 14 },
    { header: "Due Amount", key: "dueAmount", width: 14 },
    { header: "Created Date", key: "createdAt", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  bills.forEach((bill) => {
    sheet.addRow({
      billNo: bill.billNo,
      appointmentNo: bill.appointmentNo,
      patientName: bill.patient.fullName,
      age: bill.patient.age,
      gender: bill.patient.gender,
      mobile: bill.patient.mobile,
      referral: bill.patient.referral ?? "--",
      organization: bill.patient.organization ?? "--",
      tests: bill.tests.map((t) => t.testName).join(", "),
      status: bill.status,
      paymentStatus: bill.paymentStatus,
      netAmount: bill.netAmount,
      amountPaid: bill.amountPaid,
      dueAmount: bill.dueAmount,
      createdAt: new Date(bill.createdAt).toLocaleString("en-IN"),
    });
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/** Builds the Sample Order List export workbook — same columns as the
 *  Sample Order table — and returns it as a Buffer ready to stream. */
export async function generateSampleListExcel(samples: SampleRecord[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Samples");

  sheet.columns = [
    { header: "Sample No", key: "sampleNo", width: 16 },
    { header: "Appointment No", key: "appointmentNo", width: 16 },
    { header: "Patient Name", key: "patientName", width: 24 },
    { header: "Age", key: "age", width: 8 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Mobile", key: "mobile", width: 14 },
    { header: "Sample Type", key: "sampleType", width: 16 },
    { header: "Container", key: "container", width: 16 },
    { header: "Tests", key: "tests", width: 40 },
    { header: "Status", key: "status", width: 12 },
    { header: "Emergency", key: "emergency", width: 10 },
    { header: "Collected At", key: "collectedAt", width: 20 },
    { header: "Received At", key: "receivedAt", width: 20 },
    { header: "Created Date", key: "createdAt", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  samples.forEach((sample) => {
    sheet.addRow({
      sampleNo: sample.sampleNo,
      appointmentNo: sample.appointmentNo,
      patientName: sample.patient.fullName,
      age: sample.patient.age,
      gender: sample.patient.gender,
      mobile: sample.patient.mobile,
      sampleType: sample.sampleType,
      container: sample.containerName ?? "--",
      tests: sample.tests.map((t) => t.testName).join(", "),
      status: sample.status,
      emergency: sample.isEmergency ? "Yes" : "No",
      collectedAt: sample.collectedAt ? new Date(sample.collectedAt).toLocaleString("en-IN") : "--",
      receivedAt: sample.receivedAt ? new Date(sample.receivedAt).toLocaleString("en-IN") : "--",
      createdAt: new Date(sample.createdAt).toLocaleString("en-IN"),
    });
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/** Builds the Organization List export workbook — same columns as the
 *  Organizations table — and returns it as a Buffer ready to stream. */
export async function generateOrganizationListExcel(
  organizations: OrganizationDto[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Organizations");

  sheet.columns = [
    { header: "Code", key: "code", width: 14 },
    { header: "Name", key: "name", width: 26 },
    { header: "Type", key: "type", width: 18 },
    { header: "Contact Person", key: "contactPerson", width: 22 },
    { header: "Mobile", key: "mobile", width: 14 },
    { header: "Email", key: "email", width: 24 },
    { header: "City", key: "city", width: 16 },
    { header: "State", key: "state", width: 16 },
    { header: "Price List", key: "priceListName", width: 18 },
    { header: "Payment Type", key: "paymentType", width: 14 },
    { header: "Credit Limit", key: "creditLimit", width: 14 },
    { header: "Advance Amount", key: "advanceAmount", width: 16 },
    { header: "Due Days", key: "dueDays", width: 10 },
    { header: "Login Enabled", key: "loginEnabled", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Created Date", key: "createdAt", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  organizations.forEach((org) => {
    sheet.addRow({
      code: org.code,
      name: org.name,
      type: org.type === "GENERAL_CENTER" ? "General Center" : "Collection Center",
      contactPerson: org.contactPerson ?? "--",
      mobile: org.mobile,
      email: org.email ?? "--",
      city: org.city ?? "--",
      state: org.state ?? "--",
      priceListName: org.priceListName ?? "--",
      paymentType: org.paymentType,
      creditLimit: org.creditLimit,
      advanceAmount: org.advanceAmount,
      dueDays: org.dueDays,
      loginEnabled: org.loginEnabled ? "Yes" : "No",
      status: org.active ? "Active" : "Inactive",
      createdAt: new Date(org.createdAt).toLocaleString("en-IN"),
    });
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/** Builds the Report List export workbook — same columns as the Report List
 *  table — and returns it as a Buffer ready to stream. */
export async function generateReportListExcel(reports: ReportListItem[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reports");

  sheet.columns = [
    { header: "Report No", key: "reportNo", width: 16 },
    { header: "Appointment No", key: "appointmentNo", width: 16 },
    { header: "Patient Name", key: "patientName", width: 24 },
    { header: "Age", key: "age", width: 8 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Mobile", key: "mobile", width: 14 },
    { header: "Tests", key: "tests", width: 40 },
    { header: "Status", key: "status", width: 14 },
    { header: "Emergency", key: "emergency", width: 10 },
    { header: "Approved At", key: "approvedAt", width: 20 },
    { header: "Created Date", key: "createdAt", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };

  reports.forEach((report) => {
    sheet.addRow({
      reportNo: report.reportNo,
      appointmentNo: report.appointmentNo,
      patientName: report.patient.fullName,
      age: report.patient.age,
      gender: report.patient.gender,
      mobile: report.patient.mobile,
      tests: report.tests.map((t) => t.testName).join(", "),
      status: report.status,
      emergency: report.isEmergency ? "Yes" : "No",
      approvedAt: report.approvedAt ? new Date(report.approvedAt).toLocaleString("en-IN") : "--",
      createdAt: new Date(report.createdAt).toLocaleString("en-IN"),
    });
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/** Builds the Marketing Staff Monthly Report export workbook — same columns
 *  as the Monthly Report table, plus a totals row — and returns it as a
 *  Buffer ready to stream as an .xlsx download. */
export async function generateMarketingReportExcel(report: MonthlyReportResult): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Monthly Report ${report.month}-${report.year}`);

  sheet.columns = [
    { header: "Employee Code", key: "employeeCode", width: 16 },
    { header: "Staff Name", key: "staffName", width: 24 },
    { header: "Revenue Target", key: "revenueTarget", width: 16 },
    { header: "Revenue Achieved", key: "revenueAchieved", width: 16 },
    { header: "Doctor Target", key: "doctorTarget", width: 14 },
    { header: "Doctors Achieved", key: "doctorsAchieved", width: 16 },
    { header: "Patient Target", key: "patientTarget", width: 14 },
    { header: "Patients Achieved", key: "patientsAchieved", width: 16 },
    { header: "Achievement %", key: "achievementPercent", width: 14 },
    { header: "Commission", key: "commissionAmount", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  report.rows.forEach((row) => {
    sheet.addRow({
      employeeCode: row.employeeCode,
      staffName: row.staffName,
      revenueTarget: row.revenueTarget,
      revenueAchieved: row.revenueAchieved,
      doctorTarget: row.doctorTarget,
      doctorsAchieved: row.doctorsAchieved,
      patientTarget: row.patientTarget,
      patientsAchieved: row.patientsAchieved,
      achievementPercent: row.achievementPercent ?? "--",
      commissionAmount: row.commissionAmount,
    });
  });

  const totalsRow = sheet.addRow({
    employeeCode: "",
    staffName: "Total",
    revenueTarget: report.totals.revenueTarget,
    revenueAchieved: report.totals.revenueAchieved,
    doctorTarget: report.totals.doctorTarget,
    doctorsAchieved: report.totals.doctorsAchieved,
    patientTarget: report.totals.patientTarget,
    patientsAchieved: report.totals.patientsAchieved,
    achievementPercent: report.totals.overallAchievementPercent ?? "--",
    commissionAmount: report.totals.commissionAmount,
  });
  totalsRow.font = { bold: true };

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/** Builds the Referral Settlement List export workbook — same columns as
 *  the Referral Settlement table — and returns it as a Buffer ready to
 *  stream as an .xlsx download. */
export async function generateReferralSettlementExcel(
  settlements: ReferralSettlementDto[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Referral Settlements");

  sheet.columns = [
    { header: "Referral", key: "referral", width: 24 },
    { header: "From Date", key: "fromDate", width: 14 },
    { header: "To Date", key: "toDate", width: 14 },
    { header: "Patients", key: "patients", width: 10 },
    { header: "Revenue", key: "revenue", width: 14 },
    { header: "Commission %", key: "commissionPercentage", width: 14 },
    { header: "Commission Amount", key: "commissionAmount", width: 16 },
    { header: "Adjustment", key: "adjustment", width: 12 },
    { header: "Final Amount", key: "finalAmount", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Payment Date", key: "paymentDate", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  settlements.forEach((settlement) => {
    sheet.addRow({
      referral: settlement.referralSourceName,
      fromDate: settlement.fromDate,
      toDate: settlement.toDate,
      patients: settlement.totalPatients,
      revenue: settlement.totalRevenue,
      commissionPercentage: settlement.commissionPercentage,
      commissionAmount: settlement.commissionAmount,
      adjustment: settlement.adjustment,
      finalAmount: settlement.finalAmount,
      status: settlement.settlementStatus,
      paymentDate: settlement.paymentDate
        ? new Date(settlement.paymentDate).toLocaleString("en-IN")
        : "--",
    });
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/** Builds the Finance Report export workbook — a "By Date Wise" row-level
 *  sheet, or a group-summary sheet for the Organisation/Referral-wise tabs —
 *  plus a totals row, matching whichever `groupBy` the caller is viewing. */
export async function generateFinanceReportExcel(
  result: FinanceReportResult,
  groupBy: FinanceReportGroupBy,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Finance Report");

  if (groupBy === "date") {
    sheet.columns = [
      { header: "Invoice No", key: "billNo", width: 18 },
      { header: "Name", key: "patientName", width: 22 },
      { header: "Age/Gender", key: "ageGender", width: 12 },
      { header: "Appointment No", key: "appointmentNo", width: 16 },
      { header: "Receipt Date", key: "receiptDate", width: 20 },
      { header: "Gross Total", key: "grossTotal", width: 14 },
      { header: "Net Amount", key: "netAmount", width: 14 },
      { header: "Paid Amount", key: "paidAmount", width: 14 },
      { header: "Discount", key: "discountAmount", width: 12 },
      { header: "Due", key: "dueAmount", width: 12 },
      { header: "Payment Mode", key: "paymentMode", width: 14 },
      { header: "Organization", key: "organization", width: 20 },
      { header: "Doctor", key: "doctor", width: 20 },
      { header: "Status", key: "status", width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };

    result.rows.forEach((row) => {
      sheet.addRow({
        billNo: row.billNo,
        patientName: row.patientName,
        ageGender: `${row.patientGender} ${row.patientAge}`,
        appointmentNo: row.appointmentNo,
        receiptDate: row.receiptDate ? new Date(row.receiptDate).toLocaleString("en-IN") : "--",
        grossTotal: row.grossTotal,
        netAmount: row.netAmount,
        paidAmount: row.paidAmount,
        discountAmount: row.discountAmount,
        dueAmount: row.dueAmount,
        paymentMode: row.paymentMode ?? "--",
        organization: row.organization ?? "N/A",
        doctor: row.doctor ?? "N/A",
        status: row.status,
      });
    });
  } else {
    sheet.columns = [
      { header: groupBy === "organisation" ? "Organisation" : "Referral", key: "name", width: 26 },
      { header: "Bills", key: "billCount", width: 10 },
      { header: "Net Amount", key: "netAmount", width: 14 },
      { header: "Collection", key: "collectionAmount", width: 14 },
      { header: "Discount", key: "discountAmount", width: 12 },
      { header: "Due", key: "dueAmount", width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };

    result.groups.forEach((group) => {
      sheet.addRow({
        name: group.name,
        billCount: group.billCount,
        netAmount: group.netAmount,
        collectionAmount: group.collectionAmount,
        discountAmount: group.discountAmount,
        dueAmount: group.dueAmount,
      });
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/** Builds the Expenses (Service Invoice) List export workbook — same
 *  columns as the Expenses list table — and returns it as a Buffer. */
export async function generateExpenseListExcel(expenses: ExpenseListItem[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Expenses");

  sheet.columns = [
    { header: "Date", key: "invoiceDate", width: 14 },
    { header: "Category", key: "categoryName", width: 20 },
    { header: "Particular's", key: "serviceName", width: 24 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Rate", key: "rate", width: 12 },
    { header: "Amount", key: "amount", width: 12 },
    { header: "Payment Mode", key: "paymentMode", width: 14 },
    { header: "Remarks", key: "remarks", width: 24 },
  ];
  sheet.getRow(1).font = { bold: true };

  expenses.forEach((expense) => {
    sheet.addRow({
      invoiceDate: new Date(expense.invoiceDate).toLocaleDateString("en-IN"),
      categoryName: expense.categoryName,
      serviceName: expense.serviceName,
      quantity: expense.quantity,
      rate: expense.rate,
      amount: expense.amount,
      paymentMode: expense.paymentMode,
      remarks: expense.remarks ?? "--",
    });
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
