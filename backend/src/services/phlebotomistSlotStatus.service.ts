import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";

export interface PhlebotomistSlotStatusResult {
  phlebotomistId: string;
  name: string;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  assignedAreas: Array<{ id: string; name: string }>;
  todaysBookings: number;
  availableSlotTemplateIds: string[];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function coversTemplate(
  phlebo: { workingHoursStart: string | null; workingHoursEnd: string | null },
  template: { startTime: string; endTime: string },
): boolean {
  if (!phlebo.workingHoursStart || !phlebo.workingHoursEnd) return false;
  return (
    timeToMinutes(phlebo.workingHoursStart) <= timeToMinutes(template.startTime) &&
    timeToMinutes(phlebo.workingHoursEnd) >= timeToMinutes(template.endTime)
  );
}

export async function getPhlebotomistSlotStatus(
  cityId: string,
  date: string,
): Promise<PhlebotomistSlotStatusResult[]> {
  const city = await prisma.city.findUnique({ where: { id: cityId } });
  if (!city) {
    throw ApiError.notFound("City not found");
  }

  const dateOnly = new Date(date);

  const [phlebos, cityTemplates] = await Promise.all([
    prisma.phlebotomist.findMany({
      where: { isActive: true, cityId },
      include: { serviceAreas: { include: { area: { select: { id: true, name: true } } } } },
      orderBy: { name: "asc" },
    }),
    prisma.citySlotTemplate.findMany({
      where: { cityId, isActive: true },
      include: { slotTemplate: true },
    }),
  ]);

  const templates = cityTemplates.map((a) => a.slotTemplate);

  const bookingCounts = await prisma.appOrder.groupBy({
    by: ["phleboId"],
    where: {
      phleboId: { in: phlebos.map((p) => p.id) },
      orderDate: dateOnly,
      status: { notIn: ["CANCELLED"] },
      isDraft: false,
    },
    _count: { _all: true },
  });
  const bookingsByPhlebo = new Map(bookingCounts.map((b) => [b.phleboId as string, b._count._all]));

  return phlebos.map((phlebo) => ({
    phlebotomistId: phlebo.id,
    name: phlebo.name,
    workingHoursStart: phlebo.workingHoursStart,
    workingHoursEnd: phlebo.workingHoursEnd,
    assignedAreas: phlebo.serviceAreas.map((sa) => ({ id: sa.area.id, name: sa.area.name })),
    todaysBookings: bookingsByPhlebo.get(phlebo.id) ?? 0,
    availableSlotTemplateIds: templates.filter((t) => coversTemplate(phlebo, t)).map((t) => t.id),
  }));
}
