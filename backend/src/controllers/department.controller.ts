import type { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as departmentService from "../services/department.service";
import type { DepartmentWriteData, ListMasterParams } from "../types/master.types";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { search, active, includeDeleted, sortBy, sortDir, page, pageSize } = req.query as Record<
    string,
    string | undefined
  >;

  const params: ListMasterParams = {
    search,
    active,
    includeDeleted,
    sortBy,
    sortDir,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  };

  const result = await departmentService.listDepartments(params);

  res.status(200).json(ApiResponse.success("Departments retrieved successfully", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const department = await departmentService.getDepartment(req.params.id);

  res.status(200).json(ApiResponse.success("Department retrieved successfully", department));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as DepartmentWriteData;

  const department = await departmentService.createDepartment(values);

  res.status(201).json(ApiResponse.success("Department created successfully", department));
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const values = req.body as DepartmentWriteData;

  const department = await departmentService.updateDepartment(req.params.id, values);

  res.status(200).json(ApiResponse.success("Department updated successfully", department));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await departmentService.deleteDepartment(req.params.id);

  res.status(200).json(ApiResponse.success("Department deleted successfully"));
});

export const restore = asyncHandler(async (req: Request, res: Response) => {
  const department = await departmentService.restoreDepartment(req.params.id);

  res.status(200).json(ApiResponse.success("Department restored successfully", department));
});

export const setStatus = asyncHandler(async (req: Request, res: Response) => {
  const { active } = req.body as { active: boolean };

  const department = await departmentService.setDepartmentStatus(req.params.id, active);

  res.status(200).json(ApiResponse.success("Department status updated successfully", department));
});
