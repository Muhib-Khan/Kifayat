const Product = require("../models/Product");
const OutOfStockDeletedProduct = require("../models/OutOfStockDeletedProduct");

const timers = new Map();

function scheduleDeletion(productId, io) {
  cancelDeletion(productId);
  const id = productId.toString();
  const TWO_MIN = 2 * 60 * 1000;

  const timeout = setTimeout(async () => {
    try {
      const product = await Product.findById(id);
      if (!product) {
        timers.delete(id);
        return;
      }
      await executeDeletion(product, io);
    } catch (err) {
      console.error("Out-of-stock deletion failed:", err);
    } finally {
      timers.delete(id);
    }
  }, TWO_MIN);

  timers.set(id, timeout);
}

function cancelDeletion(productId) {
  const id = productId.toString();
  const timeout = timers.get(id);
  if (timeout) {
    clearTimeout(timeout);
    timers.delete(id);
  }
}

async function restorePendingOnStartup(io) {
  const now = new Date();
  // Products whose deletion deadline has already passed — delete immediately
  const expired = await Product.find({
    pendingDeleteAt: { $ne: null, $lte: now },
  });
  for (const p of expired) {
    await executeDeletion(p, io);
  }
  // Products still within their 2-minute window — schedule fresh timers
  const pending = await Product.find({
    pendingDeleteAt: { $ne: null, $gt: now },
  });
  for (const p of pending) {
    scheduleDeletion(p._id, io);
  }
  const total = expired.length + pending.length;
  if (total > 0) {
    console.log(`Restored ${total} out-of-stock deletion timers (${expired.length} immediate, ${pending.length} scheduled)`);
  }
}

async function executeDeletion(product, io) {
  try {
    const id = product._id.toString();
    if (product.stock > 0) {
      product.pendingDeleteAt = null;
      await product.save();
      return;
    }
    const obj = product.toObject();
    delete obj._id;
    delete obj.__v;
    delete obj.pendingDeleteAt;

    await OutOfStockDeletedProduct.create({
      originalProductId: product._id,
      ...obj,
      deletedAt: new Date(),
      deletedBecause: "out_of_stock",
    });

    await Product.deleteOne({ _id: id });

    if (io) {
      io.emit("product_deleted", { productId: id });
    }
  } catch (err) {
    console.error("Immediate out-of-stock deletion failed:", err);
  }
}

async function deleteAllOutOfStock(io) {
  const outOfStock = await Product.find({ stock: { $lte: 0 } });
  let deleted = 0;
  for (const product of outOfStock) {
    await executeDeletion(product, io);
    deleted++;
  }
  if (deleted > 0 && io) {
    io.emit("products_updated", { source: "out-of-stock-cleanup", deleted });
  }
  return deleted;
}

module.exports = { scheduleDeletion, cancelDeletion, restorePendingOnStartup, deleteAllOutOfStock };
