/**
 * First-order free delivery promo.
 * A logged-in customer who has never placed an order gets free delivery
 * on their first order. Tracked purely on the client (localStorage) —
 * no backend fields, no impact on CSV exports.
 */
import { toast } from "sonner";

const USED_KEY = "kifayat.firstOrderFree.used";
const SEEN_KEY = "kifayat.firstOrderFree.seen";

function readFlag(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeFlag(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/**
 * True when the current customer is still entitled to free delivery on
 * their first order. Pass the user's backend order count when available;
 * otherwise the local "used" flag is the source of truth.
 */
export function isFirstOrderFreeEligible(ordersCount?: number): boolean {
  if (readFlag(USED_KEY) === "1") return false;
  if (typeof ordersCount === "number" && ordersCount > 0) return false;
  return true;
}

/** Call once after an order is placed — the free-delivery perk is spent. */
export function markFirstOrderFreeUsed() {
  writeFlag(USED_KEY, "1");
}

/**
 * One-time congratulations message shown right after login for customers
 * who still have their free-delivery perk available.
 */
export function firstOrderFreeToast(ordersCount?: number) {
  if (!isFirstOrderFreeEligible(ordersCount)) return;
  if (readFlag(SEEN_KEY) === "1") return;
  writeFlag(SEEN_KEY, "1");
  toast.success("Congratulations! 🎉 Your first order ships free — delivery is on us at checkout.");
}
