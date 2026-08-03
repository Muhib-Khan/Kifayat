const express = require("express");
const { getCart, saveCart, validateCart } = require("../controllers/cartController");
const { protect } = require("../middleware/auth");
const optionalAuth = require("../middleware/optionalAuth");

const router = express.Router();

router.get("/", protect, getCart);
router.post("/", protect, saveCart);
// Stock validation is read-only and user-independent — guests can validate too
router.post("/validate", optionalAuth, validateCart);

module.exports = router;
