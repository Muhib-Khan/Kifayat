const mongoose = require("mongoose");
const PreOrder = require("../models/PreOrder");
const Product = require("../models/Product");
const MainOrderCSVData = require("../models/MainOrderCSVData");
const Order = require("../models/Order");
const ShippingDetail = require("../models/ShippingDetail");
const LateConfirmationOrder = require("../models/LateConfirmationOrder");
const CancelOrder = require("../models/CancelOrder");
const CompensationVoucher = require("../models/CompensationVoucher");
const { logActivity, ACTIONS } = require("../utils/activityLogger");
const {
  sendLateConfirmationEmail,
  sendStockExhaustionEmail,
  sendOrderCancelledByUserEmail,
  sendInsufficientStockEmail,
  sendCompensationEmail,
} = require("../utils/email");
const { generateCompensationVouchers } = require("../utils/compensation");
const { restoreOrderVoucherUses } = require("../utils/voucherLifecycle");
const { buildHhcCSVProductFields } = require("../utils/hhcExport");

const STOCK_THRESHOLD = 15;

function getRequestBaseUrl(req) {
  const origin = req.get("origin");
  if (origin) return origin;

  const forwardedProto = String(req.get("x-forwarded-proto") || "")
    .split(",")[0]
    .trim();
  const forwardedHost = String(req.get("x-forwarded-host") || "")
    .split(",")[0]
    .trim();

  if (!forwardedHost) return "";

  const protocol = forwardedProto || "https";
  return `${protocol}://${forwardedHost}`;
}

function normalizeOrderItems(items = []) {
  return items.map((item) => ({
    product: item.product?._id || item.product,
    name: item.name || item.product?.name || "",
    price: item.price ?? item.product?.retailPrice ?? 0,
    quantity: item.quantity || 0,
    imageUrl: item.imageUrl || item.product?.imageUrl || "",
  }));
}

async function archiveToCancelOrder({ source, orderId, reason, reasonCategory, user, items, totalAmount }) {
  return CancelOrder.create({
    user: source.user || user || null,
    order: orderId,
    originalPreOrderId: source.originalPreOrderId || source._id || null,
    items: items || normalizeOrderItems(source.items || []),
    totalAmount: totalAmount || source.totalAmount || source.sellPrice || 0,
    name: source.name,
    address: source.address,
    shpType: source.shpType,
    courierCompany: source.courierCompany,
    courierCity: source.courierCity,
    phoneNumber: source.phoneNumber,
    phoneNumber2: source.phoneNumber2,
    sellPrice: source.sellPrice,
    businessProfiles: source.businessProfiles,
    courierInstruction: source.courierInstruction,
    email: source.email,
    shipping: source.shipping,
    allowToOpen: source.allowToOpen,
    cancelledAt: new Date(),
    cancelReason: reason,
    cancelReasonCategory: reasonCategory,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/workflow/confirm-preorder/:token
// User confirms pre-order from pre_order_csp
// Stock threshold = 50
//   >= 50: move to main_orders (MainOrderCSVData)
//   < 50:  move to late_confirmation_orders, restore stock, send email
// ─────────────────────────────────────────────────────────────────────────────
const confirmPreOrderWithThreshold = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 10) {
      return res.status(400).json({ success: false, message: "Invalid confirmation token." });
    }

    const preOrder = await PreOrder.findOne({ confirmationToken: token });
    if (!preOrder) {
      return res.status(404).json({ success: false, message: "Confirmation link is invalid or expired." });
    }

    if (preOrder.status === "confirmed") {
      return res.status(200).json({ success: true, message: "Order already confirmed." });
    }

    if (new Date() > new Date(preOrder.confirmationExpiresAt)) {
      return res.status(400).json({ success: false, message: "Confirmation period has expired.", expired: true });
    }

    // Check stock against threshold for every item
    const stockChecks = [];
    for (const item of preOrder.items) {
      const productId = item.product?._id || item.product;
      if (!productId) {
        stockChecks.push({ ok: false, name: item.name || "Unknown", reason: "No product reference" });
        continue;
      }
      const product = await Product.findById(productId).lean();
      if (!product) {
        stockChecks.push({ ok: false, name: item.name || "Unknown", reason: "Product not found" });
        continue;
      }
      if (product.stock < STOCK_THRESHOLD) {
        stockChecks.push({
          ok: false,
          name: product.name,
          available: product.stock,
          threshold: STOCK_THRESHOLD,
        });
      } else {
        stockChecks.push({ ok: true });
      }
    }

    const allStockOk = stockChecks.every((c) => c.ok);

    preOrder.status = allStockOk ? "confirmed" : "cancelled";
    preOrder.confirmedAt = new Date();
    await preOrder.save();

    if (!allStockOk) {
      const failedItems = stockChecks.filter((c) => !c.ok);

      await LateConfirmationOrder.create({
        user: preOrder.user,
        order: preOrder.order,
        originalPreOrderId: preOrder._id,
        items: normalizeOrderItems(preOrder.items),
        totalAmount: preOrder.totalAmount,
        name: preOrder.name,
        address: preOrder.address,
        shpType: preOrder.shpType,
        courierCompany: preOrder.courierCompany,
        courierCity: preOrder.courierCity,
        phoneNumber: preOrder.phoneNumber,
        phoneNumber2: preOrder.phoneNumber2,
        sellPrice: preOrder.sellPrice,
        businessProfiles: preOrder.businessProfiles,
        courierInstruction: preOrder.courierInstruction,
        email: preOrder.email,
        shipping: preOrder.shipping,
        allowToOpen: preOrder.allowToOpen,
        notifiedAt: new Date(),
      });

      // Restore stock
      for (const item of preOrder.items) {
        await Product.findByIdAndUpdate(item.product?._id || item.product, {
          $inc: { stock: item.quantity, salesCount: -item.quantity },
        }).catch(() => {});
      }

      try {
        await sendLateConfirmationEmail(preOrder.email, preOrder.name, preOrder);
      } catch (emailErr) {
        console.error("[Workflow] Failed to send late confirmation email:", emailErr);
      }

      await Order.deleteOne({ _id: preOrder.order }).catch(() => {});
      await ShippingDetail.deleteOne({ order: preOrder.order }).catch(() => {});
      await PreOrder.deleteOne({ _id: preOrder._id }).catch(() => {});

      // Order was not fulfilled — restore any voucher uses consumed by it
      await restoreOrderVoucherUses(preOrder.order);

      console.log(`[Workflow] Pre-order ${preOrder._id} — stock below threshold. Moved to late_confirmation_orders.`);

      return res.status(200).json({
        success: false,
        message: "Stock is currently unavailable. A notification has been sent to your email.",
        stockIssues: failedItems,
      });
    }

    // Stock is sufficient — move to main_orders
    const orderId = preOrder.order?.toString?.() || String(preOrder.order);
    const normalizedItems = normalizeOrderItems(preOrder.items);
    const { productFields, productExtras, productSearch } =
      await buildHhcCSVProductFields(preOrder.items);

    const mainPayload = {
      orderID: orderId,
      name: preOrder.name,
      address: preOrder.address,
      shpType: preOrder.shpType || "Regular",
      courierCompany: preOrder.courierCompany,
      courierCity: preOrder.courierCity,
      phoneNumber: preOrder.phoneNumber,
      phoneNumber2: preOrder.phoneNumber2,
      sellPrice: preOrder.sellPrice ?? preOrder.totalAmount,
      businessProfiles: preOrder.businessProfiles ?? 1,
      courierInstruction: preOrder.courierInstruction,
      productCount: preOrder.items.length,
      productSearch,
      ...productFields,
      ...productExtras,
      shipping: preOrder.shipping || "cod",
      allowToOpen: preOrder.allowToOpen || "",
      latitude: preOrder.latitude ?? null,
      longitude: preOrder.longitude ?? null,
      hhcStatus: "pending",
    };

    let mainOrder;
    try {
      mainOrder = await MainOrderCSVData.findOneAndUpdate(
        { orderID: orderId },
        { $set: mainPayload, $setOnInsert: { exported: false } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch (err) {
      if (err.code !== 11000) throw err;
      mainOrder = await MainOrderCSVData.findOne({ orderID: orderId });
      if (!mainOrder) throw err;
    }

    await Order.deleteOne({ _id: preOrder.order }).catch(() => {});
    await ShippingDetail.deleteOne({ order: preOrder.order }).catch(() => {});
    await PreOrder.deleteOne({ _id: preOrder._id }).catch(() => {});

    console.log(`[Workflow] Pre-order ${preOrder._id} confirmed — moved to main_orders (stock OK).`);

    return res.status(200).json({
      success: true,
      message: "Order confirmed successfully! It will be assigned to HHC shortly.",
      orderId,
    });
  } catch (err) {
    console.error("[Workflow] confirmPreOrderWithThreshold error:", err);
    return res.status(500).json({ success: false, message: "Failed to process confirmation." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/workflow/assign-hhc/:orderId
// Admin endpoint — assign order to HHC with final stock check
// ─────────────────────────────────────────────────────────────────────────────
const assignToHHC = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }

    const mainOrder = await MainOrderCSVData.findOne({ orderID: orderId });
    if (!mainOrder) {
      return res.status(404).json({ success: false, message: "Order not found in main_orders." });
    }

    if (mainOrder.hhcStatus === "assigned") {
      return res.status(200).json({ success: true, message: "Already assigned to HHC." });
    }

    // Final stock check before HHC assignment
    const preOrder = await PreOrder.findOne({ order: orderId }).lean();
    const items = preOrder?.items || [];
    const stockFailures = [];

    for (const item of items) {
      const productId = item.product?._id || item.product;
      if (!productId) continue;
      const product = await Product.findById(productId).lean();
      if (!product || product.stock < (item.quantity || 1)) {
        stockFailures.push({
          name: item.name || product?.name || "Unknown",
          available: product?.stock || 0,
          required: item.quantity || 1,
        });
      }
    }

    if (stockFailures.length > 0) {
      await MainOrderCSVData.deleteOne({ orderID: orderId });

      try {
        await sendInsufficientStockEmail(mainOrder.email || "", mainOrder.name, { _id: orderId });
      } catch (emailErr) {
        console.error("[Workflow] Failed to send insufficient stock email:", emailErr);
      }

      await archiveToCancelOrder({
        source: mainOrder,
        orderId,
        reason: "Insufficient amount/stock",
        reasonCategory: "insufficient_stock",
      });

      await logActivity({
        user: req.user,
        action: ACTIONS.ORDER_STATUS_CHANGED,
        description: `Order #${orderId.slice(-8).toUpperCase()} — insufficient stock before HHC, moved to cancel_orders.`,
        req,
        metadata: { orderId, reason: "insufficient_stock" },
      });

      console.log(`[Workflow] Order ${orderId} — insufficient stock before HHC. Removed from main_orders.`);

      return res.status(200).json({
        success: false,
        message: "Stock insufficient for HHC assignment. Order moved to cancellations. Email sent.",
        stockFailures,
      });
    }

    mainOrder.hhcStatus = "assigned";
    mainOrder.hhcAssignedAt = new Date();
    await mainOrder.save();

    await logActivity({
      user: req.user,
      action: ACTIONS.ORDER_STATUS_CHANGED,
      description: `Order #${orderId.slice(-8).toUpperCase()} assigned to HHC.`,
      req,
      metadata: { orderId, hhcStatus: "assigned" },
    });

    console.log(`[Workflow] Order ${orderId} assigned to HHC.`);

    return res.status(200).json({
      success: true,
      message: "Order assigned to HHC successfully.",
      order: mainOrder,
    });
  } catch (err) {
    console.error("[Workflow] assignToHHC error:", err);
    return res.status(500).json({ success: false, message: "Failed to assign to HHC." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/workflow/stock-exhaustion/:orderId
// Handle stock exhaustion/warehouse revenue issues
// Removes from main_orders, sends email, archives to cancel_orders
// If generateCompensation=true, gives compensation vouchers
// ─────────────────────────────────────────────────────────────────────────────
const handleStockExhaustion = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }

    const mainOrder = await MainOrderCSVData.findOne({ orderID: orderId });
    if (!mainOrder) {
      return res.status(404).json({ success: false, message: "Order not found in main_orders." });
    }

    if (mainOrder.hhcStatus === "assigned") {
      return res.status(400).json({ success: false, message: "Order already assigned to HHC. Cannot remove." });
    }

    const reasonType = req.body.reasonType || "warehouse_revenue";
    const generateComp = req.body.generateCompensation === true;
    const customNote = req.body.customNote || "";

    // Remove from main_orders
    await MainOrderCSVData.deleteOne({ orderID: orderId });

    // Find user for this order
    const preOrder = await PreOrder.findOne({ order: orderId }).populate("user", "_id email name").lean();
    const user = preOrder?.user || null;

    let cancelReasonText;
    if (reasonType === "insufficient_stock") {
      cancelReasonText = customNote || "Insufficient amount/stock";
    } else {
      cancelReasonText = customNote || "Warehouse/Revenue error";
    }

    const cancelOrder = await archiveToCancelOrder({
      source: mainOrder,
      user: user?._id || null,
      orderId,
      reason: cancelReasonText,
      reasonCategory: reasonType === "insufficient_stock" ? "insufficient_stock" : "warehouse_revenue",
    });

    // Restore any voucher uses consumed by this order
    await restoreOrderVoucherUses(orderId);

    // Compensation logic
    let compensationVouchers = [];
    if (generateComp && user) {
      const adminSpec = req.body.vouchers || null;
      compensationVouchers = await generateCompensationVouchers({
        user: user._id,
        cancelOrder: cancelOrder._id,
        adminSpec: adminSpec ? { vouchers: adminSpec } : null,
      });

      if (compensationVouchers.length > 0) {
        try {
          await sendCompensationEmail(mainOrder.email || "", mainOrder.name, { _id: orderId }, compensationVouchers);
        } catch (emailErr) {
          console.error("[Workflow] Failed to send compensation email:", emailErr);
        }
      }
    }

    // Send appropriate email if no compensation
    if (!generateComp || !compensationVouchers.length) {
      try {
        if (reasonType === "insufficient_stock") {
          await sendInsufficientStockEmail(mainOrder.email || "", mainOrder.name, { _id: orderId });
        } else {
          await sendStockExhaustionEmail(mainOrder.email || "", mainOrder.name, { _id: orderId });
        }
      } catch (emailErr) {
        console.error("[Workflow] Failed to send cancellation email:", emailErr);
      }
    }

    await logActivity({
      user: req.user,
      action: ACTIONS.ORDER_STATUS_CHANGED,
      description: `Order #${orderId.slice(-8).toUpperCase()} — cancelled (${reasonType})${generateComp ? ` + ${compensationVouchers.length} compensation voucher(s)` : ""}.`,
      req,
      metadata: { orderId, reason: reasonType, compensationCount: compensationVouchers.length },
    });

    console.log(`[Workflow] Order ${orderId} — cancelled (${reasonType})${generateComp ? ` with ${compensationVouchers.length} compensation voucher(s)` : ""}.`);

    return res.status(200).json({
      success: true,
      message: `Order removed from main_orders.${generateComp && compensationVouchers.length ? ` ${compensationVouchers.length} compensation voucher(s) generated.` : ""}`,
      compensationVouchers: compensationVouchers.length ? compensationVouchers.map(v => ({ _id: v._id, voucher_type: v.voucher_type, discount_percent: v.discount_percent })) : undefined,
      cancelOrderId: cancelOrder._id,
    });
  } catch (err) {
    console.error("[Workflow] handleStockExhaustion error:", err);
    return res.status(500).json({ success: false, message: "Failed to process stock exhaustion." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/workflow/remove-low-stock/:orderId
// Check if any product in the order has stock < threshold (50)
// ─────────────────────────────────────────────────────────────────────────────
const removeLowStockOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }

    const mainOrder = await MainOrderCSVData.findOne({ orderID: orderId });
    if (!mainOrder) {
      return res.status(404).json({ success: false, message: "Order not found in main_orders." });
    }

    if (mainOrder.hhcStatus === "assigned") {
      return res.status(400).json({ success: false, message: "Order already assigned to HHC. Cannot remove." });
    }

    const preOrder = await PreOrder.findOne({ order: orderId }).lean();
    const items = preOrder?.items || [];

    const lowStockItems = [];
    for (const item of items) {
      const productId = item.product?._id || item.product;
      if (!productId) continue;
      const product = await Product.findById(productId).lean();
      if (!product || product.stock < STOCK_THRESHOLD) {
        lowStockItems.push({
          name: item.name || product?.name || "Unknown",
          currentStock: product?.stock || 0,
          threshold: STOCK_THRESHOLD,
        });
      }
    }

    await MainOrderCSVData.deleteOne({ orderID: orderId });

    try {
      await sendInsufficientStockEmail(mainOrder.email || "", mainOrder.name, { _id: orderId });
    } catch (emailErr) {
      console.error("[Workflow] Failed to send low stock removal email:", emailErr);
    }

    await archiveToCancelOrder({
      source: mainOrder,
      orderId,
      reason: "Insufficient amount/stock",
      reasonCategory: "insufficient_stock",
    });

    // Restore any voucher uses consumed by this order
    await restoreOrderVoucherUses(orderId);

    console.log(`[Workflow] Order ${orderId} — removed from main_orders due to low stock.`);

    return res.status(200).json({
      success: true,
      message: "Order removed from main_orders. Customer notified via email.",
      lowStockItems,
    });
  } catch (err) {
    console.error("[Workflow] removeLowStockOrder error:", err);
    return res.status(500).json({ success: false, message: "Failed to remove low stock order." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/workflow/low-stock-orders
// Admin — list orders where any product has stock < threshold (50)
// ─────────────────────────────────────────────────────────────────────────────
const getLowStockOrders = async (req, res) => {
  try {
    const lowStockOrders = [];

    const mainOrders = await MainOrderCSVData.find({ hhcStatus: { $ne: "assigned" } }).lean();

    for (const order of mainOrders) {
      const preOrder = await PreOrder.findOne({ order: order.orderID }).lean();
      const items = preOrder?.items || [];
      const issues = [];

      for (const item of items) {
        const productId = item.product?._id || item.product;
        if (!productId) continue;
        const product = await Product.findById(productId).lean();
        if (!product || product.stock < STOCK_THRESHOLD) {
          issues.push({
            name: item.name || product?.name || "Unknown",
            currentStock: product?.stock || 0,
            threshold: STOCK_THRESHOLD,
          });
        }
      }

      if (issues.length > 0) {
        lowStockOrders.push({
          orderId: order.orderID,
          name: order.name,
          city: order.courierCity,
          total: order.sellPrice,
          email: order.email,
          status: "main_orders",
          createdAt: order.createdAt,
          stockIssues: issues,
        });
      }
    }

    const pendingPreOrders = await PreOrder.find({
      status: "pending",
      finalized: { $ne: true },
    })
      .populate("items.product", "name sku stock")
      .lean();

    for (const pre of pendingPreOrders) {
      const items = pre.items || [];
      const issues = [];

      for (const item of items) {
        const product = item.product;
        if (!product) continue;
        const stock = product.stock ?? 0;
        if (stock < STOCK_THRESHOLD) {
          issues.push({
            name: product.name || item.name || "Unknown",
            currentStock: stock,
            threshold: STOCK_THRESHOLD,
          });
        }
      }

      if (issues.length > 0) {
        lowStockOrders.push({
          orderId: pre.order?.toString() || pre._id.toString(),
          name: pre.name,
          city: pre.courierCity,
          total: pre.totalAmount || pre.sellPrice,
          email: pre.email,
          status: "pre_order_csp",
          createdAt: pre.createdAt,
          stockIssues: issues,
        });
      }
    }

    lowStockOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Products with stock strictly below the threshold — worst first so admins
    // see out-of-stock (0) items at the top. Products at the threshold (e.g.
    // exactly 50) are considered in stock and are not listed here.
    const lowStockProducts = await Product.find({
      hidden: { $ne: true },
      stock: { $lt: STOCK_THRESHOLD },
    })
      .sort({ stock: 1, createdAt: -1 })
      .limit(300)
      .select(
        "_id name sku category stock retailPrice wholesalePrice imageUrl featuredOnLanding hidden createdAt",
      )
      .lean();

    return res.status(200).json({
      success: true,
      count: lowStockOrders.length,
      orders: lowStockOrders,
      productCount: lowStockProducts.length,
      products: lowStockProducts,
    });
  } catch (err) {
    console.error("[Workflow] getLowStockOrders error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch low stock orders." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/workflow/cancel-preorder/:token
// User cancels pre-order — moves from pre_order_csp to cancel_orders
// ─────────────────────────────────────────────────────────────────────────────
const cancelPreOrderByUser = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length < 10) {
      return res.status(400).json({ success: false, message: "Invalid cancellation token." });
    }

    const preOrder = await PreOrder.findOne({ confirmationToken: token });
    if (!preOrder) {
      return res.status(404).json({ success: false, message: "Cancellation link is invalid or expired." });
    }

    if (preOrder.status === "confirmed") {
      return res.status(400).json({ success: false, message: "Order already confirmed and cannot be cancelled." });
    }

    // Restore stock
    for (const item of preOrder.items) {
      await Product.findByIdAndUpdate(item.product?._id || item.product, {
        $inc: { stock: item.quantity, salesCount: -item.quantity },
      }).catch(() => {});
    }

    // Move to cancel_orders
    await CancelOrder.create({
      user: preOrder.user,
      order: preOrder.order,
      originalPreOrderId: preOrder._id,
      items: normalizeOrderItems(preOrder.items),
      totalAmount: preOrder.totalAmount,
      name: preOrder.name,
      address: preOrder.address,
      shpType: preOrder.shpType,
      courierCompany: preOrder.courierCompany,
      courierCity: preOrder.courierCity,
      phoneNumber: preOrder.phoneNumber,
      phoneNumber2: preOrder.phoneNumber2,
      sellPrice: preOrder.sellPrice,
      businessProfiles: preOrder.businessProfiles,
      courierInstruction: preOrder.courierInstruction,
      email: preOrder.email,
      shipping: preOrder.shipping,
      allowToOpen: preOrder.allowToOpen,
      cancelledAt: new Date(),
      cancelReason: "Order cancelled by user.",
      cancelReasonCategory: "user_cancelled",
    });

    // Send user cancellation email
    try {
      await sendOrderCancelledByUserEmail(preOrder.email, preOrder.name, preOrder);
    } catch (emailErr) {
      console.error("[Workflow] Failed to send cancellation email:", emailErr);
    }

    // Remove original records
    await Order.deleteOne({ _id: preOrder.order }).catch(() => {});
    await ShippingDetail.deleteOne({ order: preOrder.order }).catch(() => {});
    await PreOrder.deleteOne({ _id: preOrder._id }).catch(() => {});

    // Restore any voucher uses consumed by this order
    await restoreOrderVoucherUses(preOrder.order);

    console.log(`[Workflow] Pre-order ${preOrder._id} cancelled by user — moved to cancel_orders.`);

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully. Stock has been restored.",
    });
  } catch (err) {
    console.error("[Workflow] cancelPreOrderByUser error:", err);
    return res.status(500).json({ success: false, message: "Failed to cancel order." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/workflow/cancel-system/:orderId
// Admin — system-initiated cancellation with reason type and optional compensation
// ─────────────────────────────────────────────────────────────────────────────
const adminCancelOrderSystem = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID." });
    }

    const mainOrder = await MainOrderCSVData.findOne({ orderID: orderId });
    if (!mainOrder) {
      return res.status(404).json({ success: false, message: "Order not found in main_orders." });
    }

    if (mainOrder.hhcStatus === "assigned") {
      return res.status(400).json({ success: false, message: "Order already assigned to HHC. Cannot cancel." });
    }

    const { reasonType = "warehouse_revenue", generateCompensation = false, customNote = "", vouchers: adminVouchers } = req.body;

    if (!["insufficient_stock", "warehouse_revenue"].includes(reasonType)) {
      return res.status(400).json({ success: false, message: "Invalid reasonType. Must be 'insufficient_stock' or 'warehouse_revenue'." });
    }

    // Use a transaction for atomicity
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await MainOrderCSVData.deleteOne({ orderID: orderId }).session(session);

      const preOrder = await PreOrder.findOne({ order: orderId }).session(session).populate("user", "_id email name").lean();
      const user = preOrder?.user || null;

      const cancelReasonText = customNote || (reasonType === "insufficient_stock" ? "Insufficient amount/stock" : "Warehouse/Revenue error");

      const [cancelOrder] = await CancelOrder.create([{
        user: user?._id || null,
        order: orderId,
        originalPreOrderId: preOrder?._id || null,
        items: preOrder ? normalizeOrderItems(preOrder.items) : [],
        totalAmount: mainOrder.sellPrice || mainOrder.totalAmount || 0,
        name: mainOrder.name,
        address: mainOrder.address,
        shpType: mainOrder.shpType,
        courierCompany: mainOrder.courierCompany,
        courierCity: mainOrder.courierCity,
        phoneNumber: mainOrder.phoneNumber,
        phoneNumber2: mainOrder.phoneNumber2,
        sellPrice: mainOrder.sellPrice,
        businessProfiles: mainOrder.businessProfiles,
        courierInstruction: mainOrder.courierInstruction,
        email: mainOrder.email,
        shipping: mainOrder.shipping,
        allowToOpen: mainOrder.allowToOpen,
        cancelledAt: new Date(),
        cancelReason: cancelReasonText,
        cancelReasonCategory: reasonType,
      }], { session });

      let compensationVouchers = [];
      if (generateCompensation && user) {
        compensationVouchers = await generateCompensationVouchers({
          user: user._id,
          cancelOrder: cancelOrder._id,
          adminSpec: adminVouchers ? { vouchers: adminVouchers } : null,
        });
      }

      await session.commitTransaction();
      session.endSession();

      // Restore any voucher uses consumed by this order
      await restoreOrderVoucherUses(orderId);

      // Send emails (outside transaction)
      if (generateCompensation && compensationVouchers.length > 0) {
        try {
          await sendCompensationEmail(mainOrder.email || "", mainOrder.name, { _id: orderId }, compensationVouchers);
        } catch (emailErr) {
          console.error("[Workflow] Failed to send compensation email:", emailErr);
        }
      } else if (reasonType === "insufficient_stock") {
        try {
          await sendInsufficientStockEmail(mainOrder.email || "", mainOrder.name, { _id: orderId });
        } catch (emailErr) {
          console.error("[Workflow] Failed to send insufficient stock email:", emailErr);
        }
      } else {
        try {
          await sendStockExhaustionEmail(mainOrder.email || "", mainOrder.name, { _id: orderId });
        } catch (emailErr) {
          console.error("[Workflow] Failed to send stock exhaustion email:", emailErr);
        }
      }

      await logActivity({
        user: req.user,
        action: ACTIONS.ORDER_STATUS_CHANGED,
        description: `Order #${orderId.slice(-8).toUpperCase()} — system cancelled (${reasonType})${generateCompensation ? ` + ${compensationVouchers.length} compensation voucher(s)` : ""}.`,
        req,
        metadata: { orderId, reason: reasonType, compensationCount: compensationVouchers.length },
      });

      console.log(`[Workflow] Order ${orderId} — system cancelled (${reasonType})${generateCompensation ? ` with ${compensationVouchers.length} compensation voucher(s)` : ""}.`);

      return res.status(200).json({
        success: true,
        message: `Order cancelled.${generateCompensation && compensationVouchers.length ? ` ${compensationVouchers.length} compensation voucher(s) generated.` : ""}`,
        compensationVouchers: compensationVouchers.length ? compensationVouchers.map(v => ({ _id: v._id, voucher_type: v.voucher_type, discount_percent: v.discount_percent })) : undefined,
        cancelOrderId: cancelOrder._id,
      });
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      throw txErr;
    }
  } catch (err) {
    console.error("[Workflow] adminCancelOrderSystem error:", err);
    return res.status(500).json({ success: false, message: "Failed to cancel order." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/workflow/cancel-orders/filter
// Admin — filtered list of cancelled orders
// ─────────────────────────────────────────────────────────────────────────────
const getCancelOrdersFiltered = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.reason) {
      filter.cancelReasonCategory = req.query.reason;
    }
    if (req.query.user) {
      if (mongoose.isValidObjectId(req.query.user)) {
        filter.user = req.query.user;
      } else {
        filter.$or = [
          { name: { $regex: req.query.user, $options: "i" } },
          { email: { $regex: req.query.user, $options: "i" } },
        ];
      }
    }
    if (req.query.dateFrom || req.query.dateTo) {
      filter.cancelledAt = {};
      if (req.query.dateFrom) filter.cancelledAt.$gte = new Date(req.query.dateFrom);
      if (req.query.dateTo) {
        const end = new Date(req.query.dateTo);
        end.setHours(23, 59, 59, 999);
        filter.cancelledAt.$lte = end;
      }
    }

    const [orders, total] = await Promise.all([
      CancelOrder.find(filter)
        .sort({ cancelledAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .lean(),
      CancelOrder.countDocuments(filter),
    ]);

    // Get compensation counts for each cancelled order
    const cancelOrderIds = orders.map(o => o._id);
    const compCounts = await CompensationVoucher.aggregate([
      { $match: { cancelOrder: { $in: cancelOrderIds } } },
      { $group: { _id: "$cancelOrder", count: { $sum: 1 } } },
    ]);
    const compMap = {};
    compCounts.forEach(c => { compMap[c._id.toString()] = c.count; });

    const ordersWithComp = orders.map(o => ({
      ...o,
      compensationCount: compMap[o._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      orders: ordersWithComp,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[Workflow] getCancelOrdersFiltered error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch cancel orders." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/workflow/late-confirmations  (admin)
// ─────────────────────────────────────────────────────────────────────────────
const getLateConfirmations = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      LateConfirmationOrder.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .lean(),
      LateConfirmationOrder.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[Workflow] getLateConfirmations error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch late confirmations." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/workflow/cancel-orders  (admin) — legacy unfiltered
// ─────────────────────────────────────────────────────────────────────────────
const getCancelOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      CancelOrder.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email")
        .lean(),
      CancelOrder.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[Workflow] getCancelOrders error:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch cancel orders." });
  }
};

module.exports = {
  confirmPreOrderWithThreshold,
  assignToHHC,
  handleStockExhaustion,
  cancelPreOrderByUser,
  getLateConfirmations,
  getCancelOrders,
  removeLowStockOrder,
  getLowStockOrders,
  adminCancelOrderSystem,
  getCancelOrdersFiltered,
};
