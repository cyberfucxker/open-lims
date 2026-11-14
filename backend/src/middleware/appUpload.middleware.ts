import path from "path";
import multer from "multer";
import { ApiError } from "../utils/ApiError";
import { UPLOADS_DIR } from "./upload.middleware";

/** Same local-disk convention as `upload.middleware.ts` (Report Designer's
 *  assets) — one shared `uploads/` dir, filenames prefixed per use so
 *  nothing collides. Client-declared Content-Type is never trusted for the
 *  real file type (api.md flags this repeatedly); `fileFilter` here checks
 *  the declared mimetype as a cheap first gate only — callers that need a
 *  stronger guarantee should sniff magic bytes before persisting the path. */
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

/** Complete/Edit Profile takes two independent optional files in the same
 *  multipart request — `.fields()` (not `.single()`) so either, both, or
 *  neither can be present. Disambiguates the stored filename by fieldname
 *  since both share this one Multer instance/storage config. */
const completeProfileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const prefix = file.fieldname === "verification_document" ? "verification-doc" : "profile";
    cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const uploadCompleteProfileFiles = multer({
  storage: completeProfileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).fields([
  { name: "profile_photo", maxCount: 1 },
  { name: "verification_document", maxCount: 1 },
]);

export const uploadFamilyMemberDoc = multer({
  storage: imageStorage("family-doc"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single("upload_doc");

export const uploadPrescriptionFile = multer({
  storage: imageStorage("prescription"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single("prescription_file");

export const uploadTicketScreenshot = multer({
  storage: imageStorage("ticket"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single("screenshot");

/** Phlebo App — field name `profile_pic` matches phlebo.md's Complete
 *  Profile/Update Profile contract exactly. */
export const uploadPhleboProfilePhoto = multer({
  storage: imageStorage("phlebo-profile"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single("profile_pic");

/** Phlebo App — optional proof photo on a booking status update. */
export const uploadPhleboStatusPhoto = multer({
  storage: imageStorage("phlebo-status"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single("photo");

/** Serves under the existing `/uploads` static mount in `app.ts`. */
export function uploadedFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}
