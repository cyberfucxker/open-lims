import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { generateOrganizationListExcel } from "../services/excelExport.service";
import { generateOrganizationListPdf } from "../services/organizationPdf.service";
import * as organizationService from "../services/organization.service";
import type {
  CreateOrganizationData,
  EnableLoginInput,
  ListOrganizationsParams,
  OrganizationWriteData,
  UpdateLoginInput,
} from "../types/organization.types";

function parseListParams(req: Request): ListOrganizationsParams {
  const {
    search,
    type,
    franchiseType,
    active,
    includeDeleted,
    priceListId,
    cityId,
    sortBy,
    sortDir,
    page,
    pageSize,
  } = req.query as Record<string, string | undefined>;

  return {
    search,
    type: type as ListOrganizationsParams["type"],
    franchiseType: franchiseType as ListOrganizationsParams["franchiseType"],
    active,
    includeDeleted,
    priceListId,
    cityId,
    sortBy,
    sortDir,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await organizationService.listOrganizations(parseListParams(req));

  res.status(200).json(ApiResponse.success("Organizations retrieved successfully", result));
});

export const exportExcel = asyncHandler(async (req: Request, res: Response) => {
  const rows = await organizationService.listAllOrganizationsForExport(parseListParams(req));
  const buffer = await generateOrganizationListExcel(rows);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", 'attachment; filename="organizations.xlsx"');
  res.send(buffer);
});

export const exportPdf = asyncHandler(async (req: Request, res: Response) => {
  const rows = await organizationService.listAllOrganizationsForExport(parseListParams(req));
  const buffer = await generateOrganizationListPdf(rows);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="organizations.pdf"');
  res.send(buffer);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const organization = await organizationService.getOrganization(req.params.id);

  res.status(200).json(ApiResponse.success("Organization retrieved successfully", organization));
});

export const getMine = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.organizationId) {
    throw ApiError.forbidden("This account is not linked to an organization");
  }

  const organization = await organizationService.getMyOrganization(req.user.organizationId);

  res.status(200).json(ApiResponse.success("Organization retrieved successfully", organization));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as CreateOrganizationData;

  const organization = await organizationService.createOrganization(values, req.user?.id);

  res.status(201).json(ApiResponse.success("Organization created successfully", organization));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as OrganizationWriteData;

  const organization = await organizationService.updateOrganization(
    req.params.id,
    values,
    req.user?.id,
  );

  res.status(200).json(ApiResponse.success("Organization updated successfully", organization));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await organizationService.deleteOrganization(req.params.id, req.user?.id);

  res.status(200).json(ApiResponse.success("Organization deleted successfully"));
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const organization = await organizationService.restoreOrganization(req.params.id, req.user?.id);

  res.status(200).json(ApiResponse.success("Organization restored successfully", organization));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.body as { active: boolean };

  const organization = await organizationService.setOrganizationStatus(
    req.params.id,
    active,
    req.user?.id,
  );

  res
    .status(200)
    .json(ApiResponse.success("Organization status updated successfully", organization));
});

export const enableLogin = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as EnableLoginInput;

  const organization = await organizationService.enableLogin(req.params.id, input, req.user?.id);

  res.status(201).json(ApiResponse.success("Login enabled successfully", organization));
});

export const updateLogin = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateLoginInput;

  const organization = await organizationService.updateLogin(req.params.id, input, req.user?.id);

  res.status(200).json(ApiResponse.success("Login updated successfully", organization));
});

export const disableLogin = asyncHandler(async (req: Request, res: Response) => {
  const organization = await organizationService.disableLogin(req.params.id, req.user?.id);

  res.status(200).json(ApiResponse.success("Login disabled successfully", organization));
});

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await organizationService.listAuditLogs(req.params.id);

  res.status(200).json(ApiResponse.success("Audit logs retrieved successfully", logs));
});

export const getServiceAreas = asyncHandler(async (req: Request, res: Response) => {
  const areas = await organizationService.getOrganizationServiceAreas(req.params.id);

  res.status(200).json(ApiResponse.success("Service areas retrieved successfully", areas));
});

export const setServiceAreas = asyncHandler(async (req: Request, res: Response) => {
  const { areaIds } = req.body as { areaIds: string[] };

  const areas = await organizationService.setOrganizationServiceAreas(
    req.params.id,
    areaIds,
    req.user?.id,
  );

  res.status(200).json(ApiResponse.success("Service areas updated successfully", areas));
});
