const mongoose = require("mongoose");

const confirmationGapItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, default: "" },
  price: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  imageUrl: { type: String, default: "" },
}, { _id: false });

const confirmationGapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    items: [confirmationGapItemSchema],
    totalAmount: { type: Number, default: 0 },
    name: { type: String, default: "" },
    address: { type: String, default: "" },
    shpType: { type: String, default: "Regular" },
    courierCompany: { type: String, default: "" },
    courierCity: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    phoneNumber2: { type: String, default: "" },
    sellPrice: { type: Number, default: 0 },
    businessProfiles: { type: Number, default: 1 },
    courierInstruction: { type: String, default: "" },
    email: { type: String, default: "", trim: true, lowercase: true },
    shipping: { type: String, default: "cod" },
    allowToOpen: { type: String, default: "" },
    confirmed: { type: Boolean, default: false },
    confirmationExpiresAt: { type: Date, required: true },
    confirmedAt: { type: Date, default: null },
    confirmationToken: { type: String, required: true },
  },
  { timestamps: true, collection: "ConfirmationGap" }
);

confirmationGapSchema.index({ user: 1, createdAt: -1 });
confirmationGapSchema.index({ confirmationExpiresAt: 1 });
confirmationGapSchema.index({ confirmationToken: 1 }, { unique: true });

module.exports = mongoose.model("ConfirmationGap", confirmationGapSchema);
