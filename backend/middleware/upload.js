// backend/middleware/upload.js
// File upload middleware using Multer
// npm install multer uuid

import multer   from "multer";
import path     from "path";
import fs       from "fs";
import { v4 as uuid } from "uuid";

// ── Ensure upload directories exist ──────────────────────────────────────────
const DIRS = {
  documents: "uploads/documents",
  receipts:  "uploads/receipts",
  photos:    "uploads/photos",
  temp:      "uploads/temp",
};
Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));

// ── Allowed MIME types per category ──────────────────────────────────────────
const ALLOWED = {
  documents: ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","image/jpeg","image/png"],
  receipts:  ["application/pdf","image/jpeg","image/png","image/webp"],
  photos:    ["image/jpeg","image/png","image/webp"],
};

// ── Storage factory ───────────────────────────────────────────────────────────
const makeStorage = (dir) => multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${uuid()}${ext}`;
    cb(null, name);
  },
});

// ── File filter factory ───────────────────────────────────────────────────────
const makeFilter = (allowed) => (req, file, cb) => {
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed: ${allowed.join(", ")}`), false);
  }
};

// ── Multer instances ──────────────────────────────────────────────────────────
export const uploadDocument = multer({
  storage:  makeStorage(DIRS.documents),
  fileFilter: makeFilter(ALLOWED.documents),
  limits:   { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("file");

export const uploadReceipt = multer({
  storage:  makeStorage(DIRS.receipts),
  fileFilter: makeFilter(ALLOWED.receipts),
  limits:   { fileSize: 5 * 1024 * 1024 }, // 5 MB
}).single("receipt");

export const uploadPhoto = multer({
  storage:  makeStorage(DIRS.photos),
  fileFilter: makeFilter(ALLOWED.photos),
  limits:   { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).single("photo");

export const uploadMultiple = multer({
  storage:  makeStorage(DIRS.documents),
  fileFilter: makeFilter(ALLOWED.documents),
  limits:   { fileSize: 10 * 1024 * 1024, files: 5 },
}).array("files", 5);

// ── Express middleware wrappers (converts callback → promise) ─────────────────
const wrap = (multerFn) => (req, res, next) => {
  multerFn(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Maximum size exceeded." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ error: "Too many files. Maximum 5 files allowed." });
    }
    return res.status(400).json({ error: err.message || "File upload failed." });
  });
};

export const handleDocumentUpload  = wrap(uploadDocument);
export const handleReceiptUpload   = wrap(uploadReceipt);
export const handlePhotoUpload     = wrap(uploadPhoto);
export const handleMultipleUploads = wrap(uploadMultiple);

// ── File info helper: attaches metadata to req.uploadedFile ──────────────────
export const attachFileInfo = (req, res, next) => {
  if (!req.file) return next();
  req.uploadedFile = {
    originalName: req.file.originalname,
    storedName:   req.file.filename,
    path:         req.file.path,
    url:          `/uploads/${req.file.destination.split("uploads/")[1]}/${req.file.filename}`,
    size:         formatBytes(req.file.size),
    mimeType:     req.file.mimetype,
  };
  next();
};

// ── Delete file helper ────────────────────────────────────────────────────────
export const deleteFile = (filePath) => {
  if (!filePath) return;
  const full = filePath.startsWith("/") ? filePath : path.join(process.cwd(), filePath);
  fs.unlink(full, (err) => {
    if (err && err.code !== "ENOENT") console.error("File delete error:", err.message);
  });
};

// ── Utility ───────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024)             return `${bytes} B`;
  if (bytes < 1024 * 1024)      return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
