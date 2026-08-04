import headphones from "@/assets/p-headphones.jpg";
import watch from "@/assets/p-watch.jpg";
import sneakers from "@/assets/p-sneakers.jpg";
import serum from "@/assets/p-serum.jpg";
import elec from "@/assets/cat-electronics.jpg";
import fashion from "@/assets/cat-fashion.jpg";
import home from "@/assets/cat-home.jpg";
import beauty from "@/assets/cat-beauty.jpg";

// Map seeded product slugs / category slugs / public paths to bundled assets
// so the database-driven catalogue renders crisp images even though the
// `image_url` column may only store a public path.
const map: Record<string, string> = {
  // product slugs
  "wireless-over-ear-headphones": headphones,
  "classic-steel-smartwatch": watch,
  "minimal-white-sneakers": sneakers,
  "vitamin-c-glow-serum-30ml": serum,
  "fast-charging-usb-c-cable-2m": elec,
  "ceramic-mug-set-of-4": home,
  "premium-cotton-crew-tee": fashion,
  "aromatic-hair-oil-100ml": beauty,
  // category slugs
  electronics: elec,
  fashion,
  "home-kitchen": home,
  beauty,
  sports: elec,
  toys: fashion,
  // public paths (whatever the DB stored)
  "/p-headphones.jpg": headphones,
  "/p-watch.jpg": watch,
  "/p-sneakers.jpg": sneakers,
  "/p-serum.jpg": serum,
  "/cat-electronics.jpg": elec,
  "/cat-fashion.jpg": fashion,
  "/cat-home.jpg": home,
  "/cat-beauty.jpg": beauty,
};

export function resolveImage(slugOrUrl: string | null | undefined, fallbackKey?: string): string {
  if (!slugOrUrl) return (fallbackKey && map[fallbackKey]) || elec;
  if (map[slugOrUrl]) return map[slugOrUrl];
  // already a full URL (http/https) — pass through
  if (/^https?:\/\//.test(slugOrUrl)) return slugOrUrl;
  return (fallbackKey && map[fallbackKey]) || elec;
}
