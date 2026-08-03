const express = require("express");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminProtect");
const {
  generateVoucher,
  getAdminVouchers,
  getAvailableVouchers,
  buyVoucher,
  getMyVouchers,
  getAllPurchasedVouchers,
  deleteVoucher,
  applyVoucher,
  unapplyVoucher,
} = require("../controllers/voucherController");

const router = express.Router();

// ── Admin routes ──
router.post("/generate", protect, requireAdmin, generateVoucher);
router.get("/admin", protect, requireAdmin, getAdminVouchers);
router.get("/admin/purchased", protect, requireAdmin, getAllPurchasedVouchers);
router.delete("/:id", protect, requireAdmin, deleteVoucher);

// ── User routes ──
router.get("/available", protect, getAvailableVouchers);
router.post("/buy", protect, buyVoucher);
router.get("/mine", protect, getMyVouchers);
router.post("/apply", protect, applyVoucher);
router.post("/unapply", protect, unapplyVoucher);

module.exports = router;
