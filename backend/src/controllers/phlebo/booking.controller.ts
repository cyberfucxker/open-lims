import type { Request, Response } from "express";
import { asyncHandler } from "../../helpers/asyncHandler";
import { ApiError } from "../../utils/ApiError";
import { AppApiResponse } from "../../utils/AppApiResponse";
import { uploadedFileUrl } from "../../middleware/appUpload.middleware";
import * as bookingService from "../../services/phlebo/booking.service";

function requirePhlebo(req: Request) {
  if (!req.phlebo) {
    throw ApiError.unauthorized("Authentication required");
  }
  return req.phlebo;
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const { status, date_from, date_to, per_page, page } = req.query as Record<
    string,
    string | undefined
  >;

  const result = await bookingService.listBookings(phlebo.id, {
    status,
    dateFrom: date_from,
    dateTo: date_to,
    perPage: per_page ? Number(per_page) : undefined,
    page: page ? Number(page) : undefined,
  });

  res.status(200).json(AppApiResponse.success("OK", result));
});

export const listToday = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const result = await bookingService.listTodayBookings(phlebo.id);
  res.status(200).json(AppApiResponse.success("OK", result));
});

export const listUpcoming = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const result = await bookingService.listUpcomingBookings(phlebo.id);
  res.status(200).json(AppApiResponse.success("OK", result));
});

export const listCompleted = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const result = await bookingService.listCompletedBookings(phlebo.id);
  res.status(200).json(AppApiResponse.success("OK", result));
});

export const listCancelled = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const result = await bookingService.listCancelledBookings(phlebo.id);
  res.status(200).json(AppApiResponse.success("OK", result));
});

export const listPendingDrop = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const result = await bookingService.listPendingDropBookings(phlebo.id);
  res.status(200).json(AppApiResponse.success("OK", result));
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const booking = await bookingService.getBookingDetail(phlebo.id, req.params.id);
  res.status(200).json(AppApiResponse.success("OK", booking));
});

export const getFullDetail = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const booking = await bookingService.getBookingFullDetail(phlebo.id, req.params.id);
  res.status(200).json(AppApiResponse.success("OK", booking));
});

export const addItems = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const { test_ids, package_ids } = req.body as bookingService.AddBookingItemsInput;
  const booking = await bookingService.addItems(phlebo.id, req.params.id, {
    test_ids,
    package_ids,
  });
  res.status(200).json(AppApiResponse.success("Tests added", booking));
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const booking = await bookingService.removeItem(phlebo.id, req.params.id, req.params.itemId);
  res.status(200).json(AppApiResponse.success("Test removed", booking));
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const { status, remarks } = req.body as { status: string; remarks?: string };
  const photoUrl = req.file ? uploadedFileUrl(req.file.filename) : undefined;

  const booking = await bookingService.updateBookingStatus(
    phlebo.id,
    req.params.id,
    { status, remarks },
    photoUrl,
  );

  res.status(200).json(AppApiResponse.success("Status updated", booking));
});

export const verifyPin = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const { pin } = req.body as { pin: string };

  const booking = await bookingService.verifyBookingPin(phlebo.id, req.params.id, pin);

  res.status(200).json(AppApiResponse.success("PIN verified", booking));
});

export const codCollect = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const { remarks } = req.body as { remarks?: string };

  const booking = await bookingService.collectCod(phlebo.id, req.params.id, remarks);

  res.status(200).json(AppApiResponse.success("COD collected", booking));
});

export const dropSample = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const { remarks } = req.body as { remarks?: string };

  const booking = await bookingService.dropSample(phlebo.id, req.params.id, remarks);

  res.status(200).json(AppApiResponse.success("Sample dropped", booking));
});

export const bulkDropSamples = asyncHandler(async (req: Request, res: Response) => {
  const phlebo = requirePhlebo(req);
  const { booking_ids: bookingIds, remarks } = req.body as {
    booking_ids: string[];
    remarks?: string;
  };

  const result = await bookingService.bulkDropSamples(phlebo.id, bookingIds, remarks);

  res
    .status(200)
    .json(
      AppApiResponse.success(
        `Dropped ${result.dropped_count} of ${result.total} booking(s)`,
        result,
      ),
    );
});
