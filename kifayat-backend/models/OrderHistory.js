const mongoose = require("mongoose");

const orderHistorySchema = new mongoose.Schema(
  {
    orderID: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    shpType: { type: String, required: true },
    courierCompany: { type: String, required: true },
    courierCity: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    phoneNumber2: { type: String, default: "" },
    sellPrice: { type: Number, required: true },
    businessProfiles: { type: Number, default: 1 },
    courierInstruction: { type: String, default: "" },
    productCount: { type: Number, default: 0 },
    productSearch: { type: [String], default: [] },
    shipping: { type: String, required: true },
    allowToOpen: { type: String, default: "" },
    confirmationToken: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true, trim: true },
    exportedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "OrderHistory",
    strict: false,
  },
);

module.exports = mongoose.model("OrderHistory", orderHistorySchema);
