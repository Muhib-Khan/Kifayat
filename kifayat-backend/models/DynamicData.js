const mongoose = require("mongoose");

const dynamicDataSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productId: { type: String, default: "", trim: true },
    name: { type: String, default: "", trim: true },
    rawData: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Extracted from the HHC dynamic API response (multiple images / variations)
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    variations: { type: mongoose.Schema.Types.Mixed, default: [] },
    // Ordered media: [{ id, url, type: image|video }]
    gallery: { type: [mongoose.Schema.Types.Mixed], default: [] },
    fetchedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "dynamicdata" },
);

module.exports = mongoose.model("DynamicData", dynamicDataSchema);
