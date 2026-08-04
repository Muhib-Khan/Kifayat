import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/landing/PageShell";
import {
  Heart, Minus, Plus, Star, Truck, RotateCcw, ShieldCheck,
  Check, Lock, ArrowUpRight, Expand, Home, ChevronRight,
  Package, MapPin, Clock, ChevronDown, ChevronUp, Share2, Play,
  Ticket, X,
} from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ZoomImage } from "@/components/shop/ZoomImage";
import { Reveal } from "@/components/motion/Reveal";
import { flyToCart } from "@/components/motion/fly-to-cart-event";
import { cart, validateCartStock } from "@/lib/cart-store";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProductById, getSimilarProducts } from "@/lib/shop.functions";
import { recordRecentlyViewed, toggleWishlist, isWishlisted } from "@/lib/account.functions";
import { useAuth } from "@/lib/auth-store";
import { ReviewsSection } from "@/components/shop/ReviewsAndQA";
import { SEO, SITE_URL } from "@/components/seo/SEO";
import { ProductSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMyVouchers,
  applyVoucherToProduct,
  unapplyVoucherFromProduct,
  voucherExpired,
  voucherAppliedToProduct,
  voucherAppliedEntry,
  type PurchasedVoucher,
} from "@/lib/voucher.functions";

const Lightbox = lazy(() =>
  import("@/components/shop/Lightbox").then((m) => ({ default: m.Lightbox })),
);

export const Route = createFileRoute("/products/$productId")({
  loader: async ({ params }) => {
    // The backend sleeps when idle and can take 30–60 s to cold-boot.
    // Retry a few times so a slow wake-up doesn't show a false "Not found."
    for (let attempt = 0; attempt < 3; attempt++) {
      const p = await getProductById(params.productId);
      if (p) return { product: p };
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
      }
    }
    throw notFound();
  },
  component: ProductPage,
  notFoundComponent: () => (
    <PageShell>
      <div className="max-w-3xl mx-auto px-5 py-32 text-center">
        <h1 className="font-display text-6xl mb-4">Not found.</h1>
        <p className="text-muted-foreground mb-8">This object may have been removed or is no longer available.</p>
        <Link to="/products" className="bg-coal text-bone eyebrow px-8 py-4 inline-block hover:bg-coal/90 transition">
          Browse the catalogue ↗
        </Link>
      </div>
    </PageShell>
  ),
  pendingComponent: () => (
    <PageShell>
      <section className="max-w-[1600px] mx-auto px-5 lg:px-10 py-6 lg:py-10" aria-hidden>
        <Skeleton className="h-3 w-64 mb-8" />
        <div className="grid lg:grid-cols-[380px_1fr_300px] xl:grid-cols-[420px_1fr_320px] gap-6 lg:gap-8 items-start">
          <div className="space-y-3">
            <Skeleton className="aspect-square w-full bg-bone/60" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="size-14 bg-bone/60" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="space-y-4 border border-coal/10 p-5 lg:sticky lg:top-24">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </section>
    </PageShell>
  ),
  errorComponent: () => (
    <PageShell>
      <div className="px-5 py-32 text-center text-muted-foreground">Something went wrong.</div>
    </PageShell>
  ),
});

/* ── Helpers ── */

function getDeliveryEstimate(): string {
  const now = new Date();
  const d = new Date(now);
  d.setDate(d.getDate() + (now.getHours() < 14 ? 3 : 4));
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-PK", { weekday: "long", month: "short", day: "numeric" });
}

function parseDescriptionBullets(desc: string): string[] {
  const byNewline = desc.split(/\n+/).map((l) => l.trim()).filter((l) => l.length > 2);
  if (byNewline.length > 1) return byNewline;
  const bySentence = desc.split(/\.\s+/).map((s) => s.trim().replace(/\.$/, "")).filter((s) => s.length > 8);
  if (bySentence.length > 1) return bySentence;
  return [desc];
}

/** Short human label for a variation, e.g. "Original CUICKA ... | Black" → "Black". */
function variationLabel(v: any, i: number): string {
  const name = String(v?.name ?? "").trim();
  if (name) {
    const parts = name.split("|").map((s) => s.trim()).filter(Boolean);
    const last = (parts.length > 1 ? parts[parts.length - 1] : parts[0]) ?? "";
    if (last.length > 0 && last.length <= 60) return last;
    const byDash = name.split(" - ").pop()?.trim();
    if (byDash && byDash.length > 0 && byDash.length <= 60) return byDash;
    return name.length > 60 ? `Option ${i + 1}` : name;
  }
  return `Option ${i + 1}`;
}

// Variations with fewer than this many units are treated as OUT OF STOCK:
// their button is disabled and a "· Out of stock" label is shown.
const LOW_STOCK_THRESHOLD = 10;

/** True when the variation has no missing/low quantity ("less than 10" rule). */
function variationInStock(v: any): boolean {
  const q = Number(v?.quantity);
  if (v === undefined || v === null || Number.isNaN(q) || v?.quantity === undefined || v?.quantity === null) return false;
  return q >= LOW_STOCK_THRESHOLD;
}

/** Sell price shown for a variation — retailPrice (server applies the same
 *  70%-style markup to the variation that it applies to the product), else
 *  salePrice, else price, else the product's retail price. */
function variationPrice(v: any, _fallback: number): number {
  const p = Number(v?.retailPrice ?? v?.salePrice ?? v?.price);
  return Number.isFinite(p) && p > 0 ? p : _fallback;
}

function StockBadge({ inStock }: { inStock: boolean }) {
  return inStock ? (
    <span className="text-emerald-700 font-semibold text-sm">In Stock</span>
  ) : (
    <span className="text-red-600 font-semibold text-sm">Out of Stock</span>
  );
}

function StarRow({ rating, count, onClick }: { rating: number; count: number; onClick?: () => void }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <button onClick={onClick} className="flex items-center gap-2 group w-fit" aria-label={`${rating} stars`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`size-4 ${i < full ? "text-brass fill-brass" : i === full && half ? "text-brass fill-brass/40" : "text-coal/20"}`}
            strokeWidth={0}
          />
        ))}
      </div>
      {count > 0 && (
        <span className="text-sm text-brass underline underline-offset-2 group-hover:text-coal transition">
          {count.toLocaleString()} {count === 1 ? "review" : "reviews"}
        </span>
      )}
    </button>
  );
}

/* ── Main page ── */

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [qty, setQty] = useState(1);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [varIdx, setVarIdx] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [voucherModal, setVoucherModal] = useState(false);
  const [voucherBusy, setVoucherBusy] = useState(false);
  const buyAnchorRef = useRef<HTMLButtonElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: similar = [], isLoading: similarLoading } = useQuery({
    queryKey: ["similar", product.id],
    queryFn: () => getSimilarProducts(product.id),
  });

  const { data: myVouchers } = useQuery({
    queryKey: ["vouchers-mine"],
    queryFn: getMyVouchers,
    enabled: !!user,
  });

  const images = product.image_urls.length > 0 ? product.image_urls : (product.image_url ? [product.image_url] : []);
  const videos = product.videos ?? [];
  const gallery: { id: unknown; url: string; type: "image" | "video" }[] =
    product.gallery.length > 0
      ? product.gallery
      : [
          ...images.map((url) => ({ id: null, url, type: "image" as const })),
          ...videos.map((url) => ({ id: null, url, type: "video" as const })),
        ];
  const variations = product.variations ?? [];
  const selVar = variations[varIdx] ?? null;
  const effPrice = variationPrice(selVar, product.price);
  const savings = Math.max(0, product.old_price ? product.old_price - effPrice : 0);
  const discountPct = product.old_price ? Math.round((savings / product.old_price) * 100) : 0;
  const effInStock = selVar ? variationInStock(selVar) : product.inStock;
  const deliveryDate = getDeliveryEstimate();
  const bullets = product.description ? parseDescriptionBullets(product.description) : [];
  const visibleBullets = descExpanded ? bullets : bullets.slice(0, 6);

  const userVouchers = (myVouchers?.vouchers ?? []) as PurchasedVoucher[];
  const appliedPv = userVouchers.find((pv) =>
    voucherAppliedToProduct(pv, product.id, product.slug),
  );
  const appliedEntry = appliedPv
    ? voucherAppliedEntry(appliedPv, product.id, product.slug)
    : undefined;
  const appliedEntryConsumed = appliedEntry?.status === "consumed";
  const appliedPct = appliedPv?.discount_percent ?? 0;
  const eligiblePvs = userVouchers.filter(
    (pv) =>
      !voucherAppliedToProduct(pv, product.id, product.slug) &&
      !voucherExpired(pv) &&
      (pv.remaining_uses ?? 0) > 0,
  );
  const voucherPrice =
    appliedPct > 0 ? Math.round(effPrice * (1 - appliedPct / 100)) : effPrice;
  const hasVoucherDiscount = appliedPct > 0 && voucherPrice < effPrice;

  useEffect(() => {
    isWishlisted(product.id).then(({ wishlisted: w }) => setWishlisted(w));
  }, [product.id]);

  useEffect(() => {
    if (user && product.id) recordRecentlyViewed(product.id).catch(() => {});
  }, [user, product.id]);

  async function addToCart() {
    // Double-check stock with the backend before adding
    const check = await validateCartStock();
    const warning = check.warnings.find((w) => w.productId === product.id);
    if (warning) {
      toast.error(`${product.name} is out of stock and cannot be added.`);
      return;
    }
    const primaryImage = images[0] || product.image_url || "";
    cart.add({
      product_id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: voucherPrice,
      original_price: hasVoucherDiscount ? effPrice : undefined,
      voucher:
        hasVoucherDiscount && appliedPv
          ? { voucherId: appliedPv._id, percent: appliedPct }
          : undefined,
      image: primaryImage,
      ...(selVar ? { variation: variationLabel(selVar, varIdx) } : {}),
      qty,
    });
    if (buyAnchorRef.current && !reduceMotion) flyToCart(primaryImage, buyAnchorRef.current);
    toast.success(`${product.name} added to bag.`);
  }

  async function handleApplyVoucher(pv: PurchasedVoucher) {
    if (voucherBusy) return;
    setVoucherBusy(true);
    try {
      await applyVoucherToProduct(pv._id, product.id);
      qc.invalidateQueries({ queryKey: ["vouchers-mine"] });
      cart.applyVoucher(product.slug, { voucherId: pv._id, percent: pv.discount_percent });
      setVoucherModal(false);
      toast.success(`Voucher applied — ${pv.discount_percent}% off this item.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not apply voucher.");
    } finally {
      setVoucherBusy(false);
    }
  }

  async function handleRemoveVoucher() {
    if (!appliedPv || voucherBusy) return;
    setVoucherBusy(true);
    try {
      await unapplyVoucherFromProduct(appliedPv._id, product.id);
      qc.invalidateQueries({ queryKey: ["vouchers-mine"] });
      cart.removeVoucher(product.slug);
      toast.success("Voucher removed from this item.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not remove voucher.");
    } finally {
      setVoucherBusy(false);
    }
  }

  function selectVariation(i: number) {
    setVarIdx(i);
    const vid = variations[i]?.variationImgID;
    if (vid != null) {
      const gi = gallery.findIndex((g) => g.type === "image" && String(g.id) === String(vid));
      if (gi >= 0) setActiveImg(gi);
    }
  }

  function openLightbox() {
    const item = gallery[activeImg];
    if (!item || item.type !== "image") return;
    const idx = images.indexOf(item.url);
    setLightbox(idx >= 0 ? idx : activeImg);
  }

  async function handleWishlist() {
    if (!user) {
      toast.error("Sign in to save items.");
      navigate({ to: "/auth" });
      return;
    }
    setWishBusy(true);
    try {
      const { added } = await toggleWishlist(product.id);
      setWishlisted(added);
      qc.invalidateQueries({ queryKey: ["wishlisted", product.id] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(added ? "Saved to wishlist." : "Removed from wishlist.");
    } catch {
      toast.error("Could not update wishlist.");
    } finally {
      setWishBusy(false);
    }
  }

  const productUrl = `${SITE_URL}/products/${product.id}`;
  const seoTitle = product.brand
    ? `${product.name} — ${product.brand}`
    : product.name;
  const seoDesc = product.description
    ? product.description.slice(0, 155).replace(/\s+/g, " ").trim() + (product.description.length > 155 ? "…" : "")
    : `Buy ${product.name} in Pakistan at Rs ${product.price.toLocaleString()}. Fast delivery all across Pakistan. ${product.brand ?? ""}`.trim();

  const crumbs = [
    { name: "Home", url: SITE_URL },
    { name: "Products", url: `${SITE_URL}/products` },
    ...(product.category_name
      ? [{ name: product.category_name, url: `${SITE_URL}/category/${product.category_slug ?? ""}` }]
      : []),
    { name: product.name, url: productUrl },
  ];

  return (
    <PageShell>
      <SEO
        title={seoTitle}
        description={seoDesc}
        image={product.image_url ?? undefined}
        path={`/products/${product.slug || product.id}`}
        type="product"
        keywords={[product.name, product.brand, product.category_name, "buy online Pakistan", "nationwide delivery"].filter(Boolean).join(", ")}
        price={product.price}
        priceCurrency="PKR"
        availability={product.inStock ? "instock" : "oos"}
      />
      <ProductSchema
        product={{
          id: product.id,
          name: product.name,
          price: product.price,
          brand: product.brand ?? undefined,
          sku: product.sku ?? undefined,
          mpn: product.sku ?? undefined,
          image_url: product.image_url ?? undefined,
          description: product.description ?? undefined,
          old_price: product.old_price ?? undefined,
          inStock: product.inStock,
        }}
        url={productUrl}
      />
      <BreadcrumbSchema crumbs={crumbs} />

      <section className="max-w-[1600px] mx-auto px-5 lg:px-10 py-6 lg:py-10">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-1.5 text-xs text-coal/40 mb-5 flex-wrap">
          <Link to="/" className="hover:text-coal transition flex items-center gap-1">
            <Home className="size-3" /> Home
          </Link>
          <ChevronRight className="size-3" />
          <Link to="/products" className="hover:text-coal transition">Products</Link>
          {product.category_name && (
            <>
              <ChevronRight className="size-3" />
              {product.category_slug ? (
                <Link to="/category/$slug" params={{ slug: product.category_slug }} className="hover:text-coal transition">
                  {product.category_name}
                </Link>
              ) : (
                <span>{product.category_name}</span>
              )}
            </>
          )}
          <ChevronRight className="size-3" />
          <span className="text-coal/70 line-clamp-1 max-w-xs">{product.name}</span>
        </nav>

        {/* ══════════════════════════════════════════════
            TOP ZONE — 3 columns on desktop:
            [image ~38%] [info+description ~1fr] [buy box ~300px]
            On mobile: image → buy box → description (order classes)
        ══════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-[380px_1fr_300px] xl:grid-cols-[420px_1fr_320px] gap-6 lg:gap-8 items-start">

          {/* ── COL 1: Image + video gallery ── */}
          <div className="space-y-3 order-1 lg:order-none w-full max-w-[560px] mx-auto lg:max-w-none lg:mx-0">
            {gallery.length > 0 ? (
              <>
                {/* Main media — square-ish like Amazon */}
                <div
                  className="relative w-full bg-paper overflow-hidden group border border-coal/6"
                  style={{ paddingBottom: "100%" }}
                  onClick={() => {
                    if (gallery[activeImg].type === "image") openLightbox();
                  }}
                >
                  <div className="absolute inset-0">
                    {gallery[activeImg].type === "video" ? (
                      <video
                        src={gallery[activeImg].url}
                        controls
                        playsInline
                        preload="metadata"
                        className="size-full object-contain p-4"
                        aria-label={`${product.name} video`}
                      />
                    ) : (
                      <ZoomImage
                        src={gallery[activeImg].url}
                        alt={product.name}
                        className="size-full object-contain p-4 cursor-zoom-in"
                      />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox();
                    }}
                    className={`absolute top-3 right-3 size-8 bg-bone/90 grid place-items-center border border-coal/10 transition ${
                      gallery[activeImg].type === "image" ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                    }`}
                    aria-label="Expand image"
                  >
                    <Expand className="size-3.5 text-coal" strokeWidth={1.5} />
                  </button>
                  {product.badge && (
                    <span className="absolute top-3 left-3 bg-brass text-coal eyebrow px-2.5 py-1 text-[10px]">
                      {product.badge}
                    </span>
                  )}
                  {discountPct > 0 && !product.badge && (
                    <span className="absolute top-3 left-3 bg-red-600 text-white eyebrow px-2.5 py-1 text-[10px]">
                      -{discountPct}% OFF
                    </span>
                  )}
                </div>

                {/* Thumbnail strip */}
                {gallery.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {gallery.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`relative shrink-0 w-14 h-14 bg-paper overflow-hidden border-2 transition ${
                          activeImg === i ? "border-coal" : "border-coal/10 hover:border-coal/30"
                        }`}
                        aria-label={`${product.name} media ${i + 1}${item.type === "video" ? " (video)" : ""}`}
                      >
                        {item.type === "video" ? (
                          <>
                            <video src={item.url} muted playsInline preload="metadata" className="size-full object-contain p-1" />
                            <span className="absolute inset-0 grid place-items-center bg-coal/25">
                              <span className="size-5 grid place-items-center rounded-full bg-bone/90">
                                <Play className="size-2.5 text-coal ml-0.5" fill="currentColor" strokeWidth={0} />
                              </span>
                            </span>
                          </>
                        ) : (
                          <img src={item.url} alt={`${product.name} ${i + 1}`} className="size-full object-contain p-1" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Share link */}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied!");
                    }
                  }}
                  className="flex items-center gap-2 text-xs text-coal/40 hover:text-coal transition mx-auto"
                >
                  <Share2 className="size-3.5" strokeWidth={1.5} /> Share
                </button>
              </>
            ) : (
              <div className="relative w-full bg-bone overflow-hidden border border-coal/6" style={{ paddingBottom: "100%" }}>
                <div className="absolute inset-0 grid place-items-center">
                  <span className="font-display italic text-[140px] leading-none text-coal/6 select-none">
                    {(product.name || "K")[0].toUpperCase()}
                  </span>
                </div>
                {product.badge && (
                  <span className="absolute top-3 left-3 bg-brass text-coal eyebrow px-2.5 py-1 text-[10px]">
                    {product.badge}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── COL 2: Title, stars, price, description, specs ── */}
          <div className="min-w-0 space-y-5 lg:border-r border-coal/8 lg:pr-8 order-last lg:order-none">

            {/* Identity */}
            <Reveal delay={0}>
              {/* Brand + category */}
              <div className="flex items-center gap-2 eyebrow text-coal/40 text-[10px] mb-2">
                {product.category_name && (
                  <span>
                    {product.category_slug ? (
                      <Link to="/category/$slug" params={{ slug: product.category_slug }} className="hover:text-brass transition">
                        {product.category_name}
                      </Link>
                    ) : product.category_name}
                  </span>
                )}
                {product.category_name && product.brand && <span>·</span>}
                {product.brand && <span className="text-coal/70">{product.brand}</span>}
                {(product.salesCount ?? 0) > 0 && (
                  <><span>·</span><span className="text-brass">{product.salesCount!.toLocaleString()} sold</span></>
                )}
              </div>

              {/* Full product name — no truncation */}
              <h1 className="font-display italic text-2xl lg:text-3xl xl:text-4xl leading-tight mb-3">
                {product.name}
              </h1>

              {/* Stars */}
              <StarRow
                rating={4.2}
                count={0}
                onClick={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              />

              {/* Divider */}
              <div className="border-t border-coal/8 mt-4" />
            </Reveal>

            {/* Price block */}
            <Reveal delay={0.04}>
              <div className="flex items-baseline gap-3 flex-wrap">
                {discountPct > 0 && !hasVoucherDiscount && (
                  <span className="text-red-600 font-bold text-lg">-{discountPct}%</span>
                )}
                {hasVoucherDiscount && (
                  <span className="text-emerald-700 font-bold text-lg">Voucher −{appliedPct}%</span>
                )}
                <span className="text-3xl font-display font-bold text-coal">
                  Rs {voucherPrice.toLocaleString()}
                </span>
                {hasVoucherDiscount ? (
                  <span className="text-sm text-coal/40">
                    Was: <span className="line-through">Rs {effPrice.toLocaleString()}</span>
                  </span>
                ) : product.old_price && (
                  <span className="text-sm text-coal/40">
                    List: <span className="line-through">Rs {product.old_price.toLocaleString()}</span>
                  </span>
                )}
              </div>
              {hasVoucherDiscount ? (
                <p className="text-xs text-emerald-700 mt-1 font-medium">
                  You save Rs {(effPrice - voucherPrice).toLocaleString()} with your voucher
                </p>
              ) : savings > 0 && (
                <p className="text-xs text-emerald-700 mt-1 font-medium">
                  You save Rs {savings.toLocaleString()} ({discountPct}%)
                </p>
              )}
              <div className="border-t border-coal/8 mt-4" />
            </Reveal>

            {/* Variations — from the fetched dynamic data (HHC) */}
            {variations.length > 0 && (
              <Reveal delay={0.055}>
                <div>
                  <p className="eyebrow text-[10px] text-coal/50 mb-3">§ Options</p>
                  <div className="flex flex-wrap gap-2">
                    {variations.map((v, i) => {
                      const optInStock = variationInStock(v);
                      return (
                        <button
                          key={v?.id ?? i}
                          onClick={() => selectVariation(i)}
                          disabled={!optInStock}
                          title={optInStock ? `${Number(v?.quantity).toLocaleString()} in stock` : "Out of stock"}
                          className={`px-4 py-2.5 text-xs font-medium border transition ${
                            varIdx === i
                              ? "border-coal bg-coal text-bone"
                              : "border-coal/15 text-coal/70 hover:border-coal/40 hover:text-coal"
                          } ${!optInStock ? "opacity-40 line-through cursor-not-allowed" : ""}`}
                        >
                          {variationLabel(v, i)}
                          {!optInStock && (
                            <span className="font-normal opacity-90 ml-1.5 normal-case">Out of stock</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selVar && (
                    <p className={`text-[11px] mt-2 ${variationInStock(selVar) ? "text-coal/45" : "text-red-600 font-semibold"}`}>
                      {variationInStock(selVar)
                        ? `Rs ${Number(variationPrice(selVar, product.price)).toLocaleString()} · ${Number(selVar.quantity).toLocaleString()} in stock`
                        : "Out of stock — this option cannot be ordered"}
                    </p>
                  )}
                </div>
                <div className="border-t border-coal/8 mt-4" />
              </Reveal>
            )}

            {/* Specs table — key attributes, like Amazon's quick spec rows */}
            {(product.brand || product.sku || product.weight || product.category_name) && (
              <Reveal delay={0.07}>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      product.brand && { label: "Brand", value: product.brand },
                      product.category_name && { label: "Category", value: product.category_name },
                      product.sku && { label: "SKU / Model", value: product.sku },
                      product.weight && product.weight > 0 && { label: "Weight", value: `${product.weight} kg` },
                    ].filter(Boolean).map((row: any, i, arr) => (
                      <tr key={row.label} className={i < arr.length - 1 ? "border-b border-coal/6" : ""}>
                        <td className="py-2.5 pr-4 text-coal/50 w-36 shrink-0 align-top">{row.label}</td>
                        <td className="py-2.5 text-coal/85 font-medium">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-coal/8 mt-4" />
              </Reveal>
            )}

            {/* About this product — bullet list */}
            {bullets.length > 0 && (
              <Reveal delay={0.1}>
                <p className="eyebrow text-[10px] text-coal/50 mb-3">§ About this product</p>
                <ul className="space-y-2.5">
                  {visibleBullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-coal/80 leading-relaxed">
                      <Check className="size-3.5 text-brass shrink-0 mt-1" strokeWidth={2.5} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                {bullets.length > 6 && (
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    className="mt-4 flex items-center gap-1.5 text-xs text-brass hover:text-coal transition font-medium"
                  >
                    {descExpanded ? (
                      <><ChevronUp className="size-3.5" /> Show less</>
                    ) : (
                      <><ChevronDown className="size-3.5" /> See all {bullets.length} details</>
                    )}
                  </button>
                )}
              </Reveal>
            )}

            {/* Video */}
            {product.videoUrl && (
              <Reveal delay={0.12} className="border border-coal/8 overflow-hidden">
                <video
                  src={product.videoUrl}
                  controls
                  playsInline
                  className="w-full aspect-video object-cover"
                  aria-label={`${product.name} video`}
                />
              </Reveal>
            )}
          </div>

          {/* ── COL 3: Sticky buy box ── */}
          <div className="lg:sticky lg:top-24 lg:self-start space-y-4 order-2 lg:order-none">

            {/* Price repeat + stock */}
            <Reveal delay={0} className="border border-coal/15 bg-card p-5 space-y-3">
              <div>
                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <span className="text-2xl font-display font-bold">
                    Rs {voucherPrice.toLocaleString()}
                  </span>
                  {hasVoucherDiscount ? (
                    <span className="text-xs text-coal/40 line-through">
                      Rs {effPrice.toLocaleString()}
                    </span>
                  ) : product.old_price && (
                    <span className="text-xs text-coal/40 line-through">
                      Rs {product.old_price.toLocaleString()}
                    </span>
                  )}
                </div>
                {hasVoucherDiscount ? (
                  <p className="text-xs text-emerald-700 font-medium">
                    Voucher −{appliedPct}% · save Rs {(effPrice - voucherPrice).toLocaleString()}
                  </p>
                ) : savings > 0 && (
                  <p className="text-xs text-emerald-700 font-medium">Save Rs {savings.toLocaleString()}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <StockBadge inStock={effInStock} />
                {effInStock && (
                  <span className="eyebrow text-[10px] text-coal/40">Ready to ship</span>
                )}
              </div>

              {/* ── Voucher ── */}
              {user && (
                <div className="border border-coal/10 rounded p-3 space-y-2">
                  {appliedPv ? (
                    <>
                      <p className="text-xs text-emerald-700 font-semibold">
                        <Ticket className="size-3.5 inline-block mr-1 text-brass" strokeWidth={1.5} />
                        −{appliedPct}% applied — Rs {voucherPrice.toLocaleString()}
                      </p>
                      {appliedEntryConsumed ? (
                        <p className="text-[11px] text-coal/45">
                          Used on your order for this item.
                        </p>
                      ) : (
                        <button
                          onClick={handleRemoveVoucher}
                          disabled={voucherBusy}
                          className="w-full inline-flex items-center justify-center gap-2 border border-coal/15 py-2 text-xs font-medium hover:border-coal/40 transition disabled:opacity-50"
                        >
                          {voucherBusy ? "Removing…" : "Remove voucher"}
                        </button>
                      )}
                    </>
                  ) : eligiblePvs.length > 0 ? (
                    <>
                      <button
                        onClick={() => {
                          if (eligiblePvs.length === 1) handleApplyVoucher(eligiblePvs[0]);
                          else setVoucherModal(true);
                        }}
                        disabled={voucherBusy}
                        className="w-full inline-flex items-center justify-center gap-2 border border-coal/15 py-2.5 text-xs font-medium hover:border-coal/40 transition disabled:opacity-50"
                      >
                        <Ticket className="size-3.5" strokeWidth={1.5} />
                        {voucherBusy ? "Applying…" : "Apply voucher"}
                        {eligiblePvs.length > 1 && (
                          <span className="text-coal/40">({eligiblePvs.length})</span>
                        )}
                      </button>
                      <p className="text-[11px] text-coal/45">
                        {eligiblePvs.length === 1
                          ? `1 voucher available · ${eligiblePvs[0].discount_percent}% off`
                          : `${eligiblePvs.length} vouchers available`}
                      </p>
                    </>
                  ) : (
                    <p className="text-[11px] text-coal/40">
                      No vouchers available for this item.
                    </p>
                  )}
                </div>
              )}

              {/* Delivery */}
              <div className="bg-bone/60 rounded p-3 space-y-2">
                <div className="flex items-start gap-2.5 text-xs text-coal/70">
                  <Truck className="size-3.5 text-brass shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <span className="font-semibold text-coal">FREE delivery</span> over Rs 5,000
                    <p className="text-coal/50 mt-0.5">Est. arrival: <span className="font-medium text-coal/70">{deliveryDate}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-coal/60">
                  <MapPin className="size-3.5 text-brass shrink-0" strokeWidth={1.5} />
                  <span>Pakistan-wide delivery</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-coal/60">
                  <Clock className="size-3.5 text-brass shrink-0" strokeWidth={1.5} />
                  <span>Order by 2 PM for faster dispatch</span>
                </div>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-3">
                <span className="eyebrow text-[10px] text-coal/60">Qty</span>
                <div className="flex items-center border border-coal/15">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="size-9 grid place-items-center hover:bg-coal/5 transition"
                    aria-label="Decrease"
                  >
                    <Minus className="size-3" strokeWidth={1.5} />
                  </button>
                  <span className="w-9 text-center text-sm font-medium">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(99, q + 1))}
                    className="size-9 grid place-items-center hover:bg-coal/5 transition"
                    aria-label="Increase"
                  >
                    <Plus className="size-3" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-2">
                <button
                  ref={buyAnchorRef}
                  onClick={addToCart}
                  disabled={!effInStock}
                  className="w-full inline-flex items-center justify-between bg-coal text-bone eyebrow px-5 py-3.5 hover:bg-brass hover:text-coal transition-all duration-300 disabled:opacity-50 text-xs"
                >
                  <span>{effInStock ? "Add to bag" : "Out of stock"}</span>
                  <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
                </button>
                <button
                  onClick={handleWishlist}
                  disabled={wishBusy}
                  className={`w-full inline-flex items-center justify-center gap-2 border py-3 text-xs eyebrow transition ${
                    wishlisted
                      ? "bg-red-50 border-red-200 text-red-500"
                      : "border-coal/15 text-coal/60 hover:border-coal/30 hover:text-coal"
                  }`}
                >
                  <Heart className="size-3.5" strokeWidth={1.5} fill={wishlisted ? "currentColor" : "none"} />
                  {wishlisted ? "Saved to wishlist" : "Save to wishlist"}
                </button>
              </div>
            </Reveal>

            {/* Trust badges */}
            <Reveal delay={0.06} className="border border-coal/10 bg-card p-4">
              <ul className="space-y-2.5">
                {[
                  { Icon: ShieldCheck, text: "Authentic, quality guaranteed" },
                  { Icon: RotateCcw, text: "7-day hassle-free returns" },
                  { Icon: Lock, text: "Cash on Delivery available" },
                  { Icon: Package, text: "Tracked, careful packaging" },
                ].map(({ Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-xs text-coal/65">
                    <Icon className="size-3.5 text-brass shrink-0" strokeWidth={1.5} />
                    {text}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        {/* ── Reviews ── */}
        <div ref={reviewsRef} className="scroll-mt-28 mt-16 lg:mt-20">
          <ReviewsSection productId={product.id} fallbackRating={0} fallbackCount={0} />
        </div>

        {/* ── You might also like ── */}
        {(similar.length > 0 || similarLoading) && (
          <section className="mt-16 lg:mt-24">
            <div className="flex items-end justify-between mb-7">
              <div>
                <p className="eyebrow text-coal/40 mb-2">§ Curated for you</p>
                <h2 className="font-display italic text-3xl lg:text-4xl leading-tight">
                  You might also like
                </h2>
              </div>
              <Link
                to="/products"
                className="hidden sm:inline-flex items-center gap-2 eyebrow text-[10px] text-coal/50 hover:text-coal transition border border-coal/10 px-4 py-2.5 hover:border-coal/30"
              >
                View all <ArrowUpRight className="size-3" strokeWidth={1.5} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
              {similarLoading && similar.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-3" aria-hidden>
                      <div className="aspect-square rounded-xl animate-pulse bg-bone/60" />
                      <div className="h-3 rounded animate-pulse bg-coal/10 w-3/4" />
                      <div className="h-3 rounded animate-pulse bg-coal/10 w-1/2" />
                    </div>
                  ))
                : similar.map((p) => (
                <Link
                  key={p.id}
                  to="/products/$productId"
                  params={{ productId: p.slug || p.id }}
                  className="group"
                >
                  <div className="aspect-square bg-paper overflow-hidden rounded-xl mb-3 relative border border-coal/6">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className={`size-full object-contain p-3 transition duration-700 [@media(hover:hover)]:group-hover:scale-105 ${p.inStock === false ? "grayscale opacity-70" : ""}`}
                      />
                    ) : (
                      <div className="size-full bg-coal/5 grid place-items-center">
                        <span className="font-display italic text-5xl text-coal/10">{p.name[0]}</span>
                      </div>
                    )}
                    {p.inStock === false && (
                      <div className="absolute inset-0 grid place-items-center">
                        <span className="eyebrow bg-coal text-bone px-3 py-1.5">Out of stock</span>
                      </div>
                    )}
                    {p.badge && p.inStock !== false && (
                      <span className="absolute top-2 left-2 bg-brass text-coal eyebrow px-2 py-0.5 text-[10px]">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  {p.brand && <p className="eyebrow text-coal/40 text-[10px] mb-1">{p.brand}</p>}
                  <p className="font-sans text-sm font-semibold leading-snug group-hover:text-brass transition mb-1 line-clamp-2">
                    {p.name}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-sm font-bold">Rs {p.price.toLocaleString()}</p>
                    {p.old_price && (
                      <p className="text-xs text-coal/40 line-through">Rs {p.old_price.toLocaleString()}</p>
                    )}
                  </div>
                </Link>
                ))}
            </div>
          </section>
        )}
      </section>

      {lightbox !== null && images.length > 0 && (
        <Suspense>
          <Lightbox
            images={images.filter(Boolean)}
            index={lightbox}
            onClose={() => setLightbox(null)}
            onIndex={(i) => setLightbox(i)}
          />
        </Suspense>
      )}

      {/* ── Voucher picker modal ── */}
      {voucherModal && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-coal/80 backdrop-blur-sm px-4 py-4 sm:py-6">
          <div className="bg-bone text-coal rounded-lg p-5 sm:p-6 w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="eyebrow text-coal/50 text-xs mb-1">§ Vouchers</p>
                <h3 className="font-display italic text-2xl">
                  Apply a voucher<span className="text-brass">.</span>
                </h3>
              </div>
              <button
                onClick={() => setVoucherModal(false)}
                className="size-8 grid place-items-center hover:bg-coal/10 rounded transition"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs text-coal/60 mb-4">
              Choose a voucher to use on <strong>{product.name}</strong>. One voucher per product.
            </p>
            <div className="space-y-3">
              {eligiblePvs.map((pv) => (
                <div
                  key={pv._id}
                  className="border border-coal/15 p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-display font-bold text-lg">{pv.discount_percent}% OFF</p>
                    <p className="text-xs text-coal/60 mt-0.5">
                      {pv.remaining_uses} {pv.remaining_uses === 1 ? "use" : "uses"} left
                      {pv.expires_at && (
                        <>
                          {" · expires "}
                          {new Date(pv.expires_at).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApplyVoucher(pv)}
                    disabled={voucherBusy}
                    className="h-10 px-5 bg-coal text-bone eyebrow text-xs hover:bg-brass hover:text-coal transition disabled:opacity-50"
                  >
                    {voucherBusy ? "Applying…" : "Apply"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
