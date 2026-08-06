// Low-price rule: retail < 500 => flat +270, no % margin
const LOW_PRICE_THRESHOLD = 500;
const LOW_PRICE_FLAT_ADD = 270;
// Universal add-on applied to every product AFTER the low-price/% classification
const UNIVERSAL_ADD = 150;

// wholesale must be > 0; returns { retail, lowPrice }
// - if lowPrice flag is set (persisted): always wholesale + 270
// - else compute % markup; if result < 500 -> flat +270 and mark lowPrice
// - classification happens on the pre-+100 value; UNIVERSAL_ADD is applied last
function computeRetail(wholesale, pct, lowPrice = false) {
  if (!wholesale || wholesale <= 0) return null;
  let retail;
  let isLow;
  if (lowPrice) {
    retail = wholesale + LOW_PRICE_FLAT_ADD;
    isLow = true;
  } else {
    const markedUp = Math.round(wholesale * (1 + pct / 100));
    if (markedUp < LOW_PRICE_THRESHOLD) {
      retail = wholesale + LOW_PRICE_FLAT_ADD;
      isLow = true;
    } else {
      retail = markedUp;
      isLow = false;
    }
  }
  return { retail: retail + UNIVERSAL_ADD, lowPrice: isLow };
}
module.exports = { computeRetail, LOW_PRICE_THRESHOLD, LOW_PRICE_FLAT_ADD, UNIVERSAL_ADD };
