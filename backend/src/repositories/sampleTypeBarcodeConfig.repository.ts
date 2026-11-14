import type { Prisma, SampleType, SampleTypeBarcodeConfig } from "@prisma/client";
import { prisma } from "../config/database";
import type {
  SampleTypeBarcodeConfigDto,
  SampleTypeBarcodeConfigWriteData,
} from "../types/master.types";

const withConfig = {
  barcodeConfig: true,
} satisfies Prisma.SampleTypeInclude;

type SampleTypeWithConfig = SampleType & { barcodeConfig: SampleTypeBarcodeConfig | null };

export function toSampleTypeBarcodeConfigDto(
  sampleType: SampleTypeWithConfig,
): SampleTypeBarcodeConfigDto {
  return {
    sampleTypeId: sampleType.id,
    sampleTypeName: sampleType.name,
    prefix: sampleType.barcodeConfig?.prefix ?? null,
    numberLength: sampleType.barcodeConfig?.numberLength ?? 6,
    active: sampleType.barcodeConfig?.active ?? false,
    updatedAt: sampleType.barcodeConfig ? sampleType.barcodeConfig.updatedAt.toISOString() : null,
  };
}

export interface ListSampleTypeBarcodeConfigsFilter {
  search?: string;
  skip: number;
  take: number;
}

export async function listSampleTypeBarcodeConfigs(
  filter: ListSampleTypeBarcodeConfigsFilter,
): Promise<{ rows: SampleTypeWithConfig[]; total: number }> {
  const where: Prisma.SampleTypeWhereInput = { deletedAt: null };
  if (filter.search) {
    where.name = { contains: filter.search, mode: "insensitive" };
  }

  const [rows, total] = await Promise.all([
    prisma.sampleType.findMany({
      where,
      include: withConfig,
      orderBy: { name: "asc" },
      skip: filter.skip,
      take: filter.take,
    }),
    prisma.sampleType.count({ where }),
  ]);

  return { rows, total };
}

export function findSampleTypeWithConfigById(sampleTypeId: string) {
  return prisma.sampleType.findFirst({
    where: { id: sampleTypeId, deletedAt: null },
    include: withConfig,
  });
}

export function upsertSampleTypeBarcodeConfig(
  sampleTypeId: string,
  data: SampleTypeBarcodeConfigWriteData,
) {
  return prisma.sampleTypeBarcodeConfig.upsert({
    where: { sampleTypeId },
    create: { sampleTypeId, ...data },
    update: data,
  });
}
