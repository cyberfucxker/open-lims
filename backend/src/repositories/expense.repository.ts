import type { Expense, ExpenseCategory, ExpenseService, Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { fromDbPaymentMode, toDbPaymentMode } from "../utils/enumMappers";
import type {
  ExpenseCategoryDto,
  ExpenseCategoryWriteData,
  ExpenseListItem,
  ExpenseServiceDto,
  ExpenseServiceWriteData,
  ExpenseWriteData,
  ListExpensesParams,
} from "../types/expense.types";

export function toExpenseCategoryDto(category: ExpenseCategory): ExpenseCategoryDto {
  return {
    id: category.id,
    name: category.name,
    active: category.active,
    createdAt: category.createdAt.toISOString(),
  };
}

export function listActiveExpenseCategories() {
  return prisma.expenseCategory.findMany({
    where: { deletedAt: null, active: true },
    orderBy: { name: "asc" },
  });
}

export function createExpenseCategory(data: ExpenseCategoryWriteData) {
  return prisma.expenseCategory.create({ data: { name: data.name } });
}

type ExpenseServiceWithCategory = ExpenseService & { category: { name: string } };

export function toExpenseServiceDto(service: ExpenseServiceWithCategory): ExpenseServiceDto {
  return {
    id: service.id,
    categoryId: service.categoryId,
    categoryName: service.category.name,
    name: service.name,
    active: service.active,
    createdAt: service.createdAt.toISOString(),
  };
}

export function listActiveExpenseServices(categoryId?: string) {
  return prisma.expenseService.findMany({
    where: { deletedAt: null, active: true, ...(categoryId ? { categoryId } : {}) },
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}

export function createExpenseService(data: ExpenseServiceWriteData) {
  return prisma.expenseService.create({
    data: { categoryId: data.categoryId, name: data.name },
    include: { category: { select: { name: true } } },
  });
}

type ExpenseWithRelations = Expense & {
  category: { name: string };
  service: { name: string };
};

export function toExpenseListItem(expense: ExpenseWithRelations): ExpenseListItem {
  return {
    id: expense.id,
    categoryId: expense.categoryId,
    categoryName: expense.category.name,
    serviceId: expense.serviceId,
    serviceName: expense.service.name,
    invoiceDate: expense.invoiceDate.toISOString(),
    quantity: Number(expense.quantity),
    rate: Number(expense.rate),
    amount: Number(expense.amount),
    paymentMode: fromDbPaymentMode(expense.paymentMode),
    paymentType: expense.paymentType,
    remarks: expense.remarks,
    createdAt: expense.createdAt.toISOString(),
  };
}

function buildWhere(
  filter: Pick<ListExpensesParams, "search" | "dateFrom" | "dateTo" | "categoryId" | "serviceId">,
): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = {};

  if (filter.categoryId) where.categoryId = filter.categoryId;
  if (filter.serviceId) where.serviceId = filter.serviceId;
  if (filter.dateFrom || filter.dateTo) {
    where.invoiceDate = {
      ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
      ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
    };
  }
  if (filter.search) {
    where.OR = [
      { remarks: { contains: filter.search, mode: "insensitive" } },
      { service: { is: { name: { contains: filter.search, mode: "insensitive" } } } },
      { category: { is: { name: { contains: filter.search, mode: "insensitive" } } } },
    ];
  }

  return where;
}

const include = {
  category: { select: { name: true } },
  service: { select: { name: true } },
} satisfies Prisma.ExpenseInclude;

export async function listExpenses(
  filter: ListExpensesParams & { skip: number; take: number },
): Promise<{ rows: ExpenseWithRelations[]; total: number; subTotal: number }> {
  const where = buildWhere(filter);

  const [rows, total, aggregate] = await Promise.all([
    prisma.expense.findMany({
      where,
      include,
      orderBy: { invoiceDate: "desc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  return { rows, total, subTotal: Number(aggregate._sum.amount ?? 0) };
}

/** Every matching expense, unpaginated — used by the Excel/PDF export. */
export async function listAllExpensesForExport(
  filter: ListExpensesParams,
): Promise<ExpenseWithRelations[]> {
  const where = buildWhere(filter);
  return prisma.expense.findMany({ where, include, orderBy: { invoiceDate: "desc" }, take: 10000 });
}

export function createExpense(data: ExpenseWriteData, createdByUserId?: string | null) {
  return prisma.expense.create({
    data: {
      categoryId: data.categoryId,
      serviceId: data.serviceId,
      invoiceDate: new Date(data.invoiceDate),
      quantity: data.quantity,
      rate: data.rate,
      amount: data.amount,
      paymentMode: toDbPaymentMode(data.paymentMode),
      paymentType: data.paymentType ?? "DEBIT",
      remarks: data.remarks,
      createdByUserId,
    },
    include,
  });
}
