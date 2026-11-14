import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import { uploadedFileUrl } from "../../middleware/appUpload.middleware";
import * as prescriptionService from "../../services/app/prescription.service";

function requireAppUser(req: Request) {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.appUser;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const prescriptions = await prescriptionService.listPrescriptions(appUser.id);
  res.status(200).json(AppApiResponse.success("Prescriptions fetched successfully", prescriptions));
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);

  if (!req.file) {
    throw ApiError.badRequest("prescription_file is required");
  }

  const input = req.body as prescriptionService.SubmitPrescriptionInput;
  await prescriptionService.submitPrescription(
    appUser.id,
    input,
    uploadedFileUrl(req.file.filename),
  );

  res.status(201).json(AppApiResponse.success("Prescription submitted successfully"));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  await prescriptionService.deletePrescription(appUser.id, req.params.id);
  res.status(200).json(AppApiResponse.success("Prescription deleted successfully"));
});
