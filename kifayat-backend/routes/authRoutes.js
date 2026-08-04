const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  googleAuth,
  logout,
  heartbeat,
  getMe,
  updateProfile,
  verifyEmailUpdate,
  resendEmailUpdateOTP,
  deleteAccount,
  sendDeleteOTP,
  changePassword,
  verifyPasswordUpdate,
  forgotPassword,
  resetPassword,
  updateOrderConEmail,
  verifyOrderConEmail,
  resendOrderConEmailOTP,
  getShipmentEmails,
  sendShipmentEmailOTP,
  verifyShipmentEmailOTP,
  removeShipmentEmail,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Avatar upload
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype);
    ok ? cb(null, true) : cb(new Error("Only images (JPEG, PNG, WebP, GIF) are allowed."));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/logout", logout);
router.post("/heartbeat", heartbeat);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);

// Profile management (all protected)
router.put("/profile", protect, updateProfile);
// Legacy/documented aliases retained for clients using the original API names.
router.post("/update", protect, updateProfile);
router.post("/verify-email-update", protect, verifyEmailUpdate);
router.post("/resend-email-update-otp", protect, resendEmailUpdateOTP);
router.post("/send-delete-otp", protect, sendDeleteOTP);
router.delete("/account", protect, deleteAccount);
router.put("/password", protect, changePassword);
router.post("/update-password", protect, changePassword);
router.post("/verify-password-update", protect, verifyPasswordUpdate);

// Avatar upload
router.post("/avatar", protect, avatarUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });
    const User = require("../models/User");
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();
    return res.status(200).json({ success: true, avatar: user.avatar });
  } catch (err) {
    console.error("Avatar upload error:", err);
    return res.status(500).json({ success: false, message: "Failed to upload avatar." });
  }
});

// Order confirmation email
router.put("/order-con-email", protect, updateOrderConEmail);
router.post("/verify-order-con-email", protect, verifyOrderConEmail);
router.post("/resend-order-con-email-otp", protect, resendOrderConEmailOTP);

// Shipment email management (replaces order-con-email for checkout flow)
router.get("/shipment-emails", protect, getShipmentEmails);
router.post("/shipment-emails/send-otp", protect, sendShipmentEmailOTP);
router.post("/shipment-emails/verify-otp", protect, verifyShipmentEmailOTP);
router.delete("/shipment-emails/:email", protect, removeShipmentEmail);

module.exports = router;
