import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import { uploadedFileUrl } from "../../middleware/appUpload.middleware";
import * as familyMemberService from "../../services/app/familyMember.service";
import type { AddFamilyMemberInput } from "../../services/app/familyMember.service";

function requireAppUser(req: Request) {
  if (!req.appUser) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.appUser;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);

  const { familyMembers, cities } = await familyMemberService.listFamilyMembersWithCities(
    appUser.id,
  );

  res.status(200).json(
    AppApiResponse.success("Family members fetched successfully", {
      family_members: familyMembers,
      city: cities,
    }),
  );
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);

  const input = req.body as AddFamilyMemberInput;
  const uploadDocUrl = req.file ? uploadedFileUrl(req.file.filename) : null;

  const member = await familyMemberService.addFamilyMember(appUser.id, input, uploadDocUrl);

  // The created member (its id above all) is returned so the client can
  // auto-select it for the current booking without waiting on/guessing at a
  // list refetch — see `AddFamilyMemberSheet.tsx`'s `onAdded`.
  res.status(201).json(AppApiResponse.success("Family member added successfully", member));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const appUser = requireAppUser(req);
  const { member_id: memberId } = req.body as { member_id: string };

  await familyMemberService.deleteFamilyMember(appUser.id, memberId);

  res.status(200).json(AppApiResponse.success("Family member deleted successfully"));
});
