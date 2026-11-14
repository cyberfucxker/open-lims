import fs from "fs";
import path from "path";
import multer from "multer";
import { ApiError } from "../utils/ApiError";

const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/svg+xml"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const assetType = req.params.assetType || "logo";
    cb(null, `report-${assetType}-${Date.now()}${ext}`);
  },
});

/** Report Designer's asset uploads (logo/header/footer/watermark/signature)
 *  — single image field named "file", max 2MB, restricted to raster/SVG
 *  image types. One multer instance shared by all five asset types; which
 *  column the resulting path is saved to is decided by
 *  `reportSettings.controller.ts#uploadAsset` from `req.params.assetType`. */
export const uploadReportAsset = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(ApiError.badRequest("File must be a PNG, JPEG or SVG image"));
      return;
    }
    cb(null, true);
  },
}).single("file");

const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

function imageStorage(prefix: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });
}

function imageFileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
    cb(ApiError.badRequest("File must be a PNG, JPEG or WEBP image"));
    return;
  }
  cb(null, true);
}

/** CMS — home-screen category tile image, uploaded from Superadmin. */
export const uploadAppCategoryImage = multer({
  storage: imageStorage("app-category"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single("image");

/** CMS — home-screen banner image, uploaded from Superadmin. */
export const uploadBannerImage = multer({
  storage: imageStorage("banner"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single("image");

/** CMS Pages — inline image inserted into a page's rich text content. */
export const uploadCmsImage = multer({
  storage: imageStorage("cms"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single("image");

/** Catalogue — the optional sample lab report an admin attaches to a Test or a
 *  Parameter so patients can see what the output looks like. PDF is allowed
 *  alongside the image types (a real specimen report is almost always a PDF),
 *  which is why this can't reuse `imageFileFilter`. Shared by both entities: the
 *  file, size cap, and accepted types are identical, and the owning row is
 *  decided by the route, not the upload. */
export const uploadCatalogueSampleReport = multer({
  storage: imageStorage("catalogue-report"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set([...IMAGE_MIME_TYPES, "application/pdf"]);
    if (!allowed.has(file.mimetype)) {
      cb(ApiError.badRequest("File must be a PDF, PNG, JPEG or WEBP"));
      return;
    }
    cb(null, true);
  },
}).single("file");

/** Catalogue CSV import (Tests/Packages/Parameters) — kept in memory since
 *  the file is parsed once in the request handler and never needs to persist
 *  to disk, unlike the image uploads above. */
export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      cb(ApiError.badRequest("File must be a CSV"));
      return;
    }
    cb(null, true);
  },
}).single("file");

export { UPLOADS_DIR };

/** Co-Lab franchise logo, uploaded from the franchise portal's Profile page.
 *  Same 2MB raster/SVG limits as the Report Designer's assets — it lands in the
 *  same place on a report. */
export const uploadLabLogo = multer({
  storage: imageStorage("franchise-logo"),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(ApiError.badRequest("Logo must be a PNG, JPEG or SVG image"));
      return;
    }
    cb(null, true);
  },
}).single("file");
