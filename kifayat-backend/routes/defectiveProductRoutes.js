const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminProtect");
const optionalAuth = require("../middleware/optionalAuth");
const {
  submitReport,
  getReports,
  getReportById,
  updateReportStatus,
  sendChatMessage,
  getChatMessages,
} = require("../controllers/defectiveProductController");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads", "defective");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `defective-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const videoTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
  if ([...imageTypes, ...videoTypes].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV, AVI) are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 3 },
  ]),
  optionalAuth,
  submitReport
);

router.get("/", protect, requireAdmin, getReports);

router.get("/:id", protect, requireAdmin, getReportById);

router.patch("/:id", protect, requireAdmin, updateReportStatus);

// ── Chat routes ──
router.post("/:id/chat", protect, sendChatMessage);
router.get("/:id/chat", protect, getChatMessages);

module.exports = router;
