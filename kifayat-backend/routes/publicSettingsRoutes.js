const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");

// ─── GET /api/settings/public — unauthenticated storefront read ──────────────
// Exposes storefront-facing settings (flat delivery fee). Defaults apply when
// the settings doc is missing or the field is unset — nothing is created here.
router.get("/public", async (req, res) => {
  try {
    const s = await Settings.findOne({}).lean();
    const deliveryFee = Number.isFinite(Number(s?.deliveryFee)) ? Number(s.deliveryFee) : 100;
    res.json({ success: true, deliveryFee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
