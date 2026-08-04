const mongoose = require("mongoose");

const purchasedVoucherSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiscountVoucher",
      required: true,
    },
    discount_percent: {
      type: Number,
      required: true,
    },
    points_spent: {
      type: Number,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    used_at: {
      type: Date,
      default: null,
    },
    total_uses: {
      type: Number,
      default: 1,
      min: 1,
    },
    expires_at: {
      type: Date,
      default: null,
    },
    applied_products: [
      {
        _id: false,
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        slug: {
          type: String,
          default: "",
        },
        applied_at: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["reserved", "consumed"],
          default: "reserved",
        },
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
          default: null,
        },
      },
    ],
  },
  { timestamps: { createdAt: "purchased_at", updatedAt: false }, collection: "purchased_vouchers" }
);

purchasedVoucherSchema.index({ user: 1, purchased_at: -1 });
purchasedVoucherSchema.index({ voucher: 1 });

module.exports = mongoose.model("PurchasedVoucher", purchasedVoucherSchema);
