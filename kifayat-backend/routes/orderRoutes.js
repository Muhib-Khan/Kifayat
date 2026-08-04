const express = require("express");
const {
  placeOrder,
  getMyOrders,
  getAllOrders,
  getAllPreOrders,
  updateOrderStatus,
  sendShippingOTP,
  verifyShippingOTP,
  finalizeOrder,
  confirmOrder,
  cancelOrder,
  getOrderByClientRequestId,
} = require("../controllers/orderController");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminProtect");

const router = express.Router();

// Public — confirm/cancel order via emailed link (no auth required)
router.get("/confirm/:token", confirmOrder);
router.get("/cancel/:token", cancelOrder);

// Authenticated users — shipping email OTP
router.post("/shipping-otp", protect, sendShippingOTP);
router.post("/verify-shipping-otp", protect, verifyShippingOTP);

// Authenticated users — place order & view own orders
router.post("/", protect, placeOrder);
// Documented alias for clients using the original checkout endpoint.
router.post("/place", protect, placeOrder);
router.get("/my", protect, getMyOrders);

// Recovery check — did the order for a client request actually get created?
router.get("/by-request/:clientRequestId", protect, getOrderByClientRequestId);

// Admin only — view all orders, pre-orders & update status
router.get("/preorders", protect, requireAdmin, getAllPreOrders);
router.get("/", protect, requireAdmin, getAllOrders);
router.patch("/:id/status", protect, requireAdmin, updateOrderStatus);
router.put("/:id/status", protect, requireAdmin, updateOrderStatus);

// Finalize expired pre-order (move to MainOrderCSVData)
router.post("/finalize/:id", protect, requireAdmin, finalizeOrder);

module.exports = router;
