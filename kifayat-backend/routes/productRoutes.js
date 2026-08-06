const express = require("express");
const multer = require("multer");
const {
  uploadCSV,
  getProducts,
  getAdminProducts,
  getLeaderboard,
  getReport,
  getStats,
  clearProducts,
  createManualProduct,
  getProductById,
  getSimilarProducts,
  updateStock,
  updateProduct,
  deleteProduct,
  updatePricingByCategory,
  updatePricingAll,
  getOutOfStockProducts,
  getCategoryPricing,
  getCategories,
  updateCategoryImage,
  getAllReports,
  getProductOrders,
  recategorizeAll,
  getRecategorizeStatus,
  getFeaturedLanding,
  toggleFeaturedLanding,
  getFeaturedCount,
} = require("../controllers/productController");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminProtect");

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ok =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");
    ok ? cb(null, true) : cb(new Error("Only .csv files are allowed."));
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = express.Router();

// Admin-only routes (must come before :id to avoid being matched as params)
router.get("/admin-list", protect, requireAdmin, getAdminProducts);
router.get("/stats", protect, requireAdmin, getStats);
router.get("/leaderboard", protect, requireAdmin, getLeaderboard);
router.get("/report", protect, requireAdmin, getReport);
router.get("/reports", protect, requireAdmin, getAllReports);
router.get("/out-of-stock", protect, requireAdmin, getOutOfStockProducts);
router.get("/categories", getCategories);
router.post("/categories/update-image", protect, requireAdmin, updateCategoryImage);
router.get("/category-pricing", protect, requireAdmin, getCategoryPricing);
router.post(
  "/upload-csv",
  protect,
  requireAdmin,
  upload.single("csv"),
  uploadCSV,
);
router.post("/manual", protect, requireAdmin, createManualProduct);
router.post("/update-pricing-by-category", protect, requireAdmin, updatePricingByCategory);
router.post("/update-pricing-category", protect, requireAdmin, updatePricingByCategory);
router.post("/update-pricing-all", protect, requireAdmin, updatePricingAll);
router.post("/recategorize-all", protect, requireAdmin, recategorizeAll);
router.get("/recategorize-status", protect, requireAdmin, getRecategorizeStatus);
router.delete("/", protect, requireAdmin, clearProducts);

// Public routes — no auth required for browsing
router.get("/", getProducts);
router.get("/featured-landing", getFeaturedLanding);
router.get("/featured-count", getFeaturedCount);
router.get("/:id/similar", getSimilarProducts);
router.patch("/:id/featured-landing", protect, requireAdmin, toggleFeaturedLanding);
router.get("/:id", getProductById);

// Authenticated user routes
router.patch("/:id/stock", protect, requireAdmin, updateStock);

// Admin-only single product management
router.get("/:id/orders", protect, requireAdmin, getProductOrders);
router.put("/:id", protect, requireAdmin, updateProduct);
router.delete("/:id", protect, requireAdmin, deleteProduct);

module.exports = router;
