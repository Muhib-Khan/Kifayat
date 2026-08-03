const express = require("express");
const {
  getUsers,
  getUserLoginHistory,
  deleteUser,
  getUserActivity,
  blockUser,
  getUserStatus,
  updateUserProfile,
  getUserTimeStats,
  setUserTier,
  setUserDiscount,
  resetUserTierAuto,
} = require("../controllers/userController");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminProtect");

const router = express.Router();

router.get("/status", getUserStatus); // public — no auth needed

router.use(protect, requireAdmin);

router.get("/", getUsers);
router.get("/:id/activity", getUserActivity);
router.get("/:id/login-history", getUserLoginHistory);
router.get("/:id/time-stats", getUserTimeStats);
router.put("/:id/profile", updateUserProfile);
router.delete("/:id", deleteUser);
router.post("/:id/block", blockUser);
router.patch("/:id/tier", setUserTier);
router.patch("/:id/discount", setUserDiscount);
router.post("/:id/reset-tier", resetUserTierAuto);

module.exports = router;
