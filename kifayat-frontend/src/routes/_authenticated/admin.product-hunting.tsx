import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminCreateProduct,
  adminGetFeaturedLandingProducts,
  adminGetFeaturedCount,
  adminToggleFeaturedOnLanding,
} from "@/lib/admin.functions";
import { listCategories } from "@/lib/shop.functions";
import { normalizeProduct, type UIProduct } from "@/lib/api";
import { Image, Inbox, Loader2, Package, Plus, Target } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";
import { PanelTableSkeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/product-hunting")({
  component: ProductHunting,
});

const EMPTY_FORM = {
  name: "",
  category: "",
  wholesalePrice: "",
  stock: "",
  weight: "",
  imageUrl: "",
  description: "",
  featuredOnLanding: true,
};

const inputClass =
  "w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brass/30 focus:border-brass transition";

function ProductHunting() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [thumbOk, setThumbOk] = useState(true);

  const set = (key: keyof typeof EMPTY_FORM, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === "imageUrl") setThumbOk(true);
  };

  // ── Categories for the datalist suggestions ────────────────────────────
  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: listCategories,
  });

  // ── Featured list + count (same keys the Products page keeps fresh) ─────
  const { data: featuredRaw, isLoading } = useQuery({
    queryKey: ["admin", "featured-landing"],
    queryFn: adminGetFeaturedLandingProducts,
  });
  const featured: UIProduct[] = (featuredRaw ?? []).map(normalizeProduct);

  const { data: featuredCount = featured.length } = useQuery({
    queryKey: ["admin", "featured-count"],
    queryFn: adminGetFeaturedCount,
  });

  const refreshFeatured = () => {
    qc.invalidateQueries({ queryKey: ["admin", "featured-landing"] });
    qc.invalidateQueries({ queryKey: ["admin", "featured-count"] });
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  // ── Create ──────────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: () =>
      adminCreateProduct({
        name: form.name.trim(),
        wholesalePrice: Number(form.wholesalePrice),
        category: form.category.trim() || undefined,
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        stock: form.stock ? Number(form.stock) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        featuredOnLanding: form.featuredOnLanding,
      }),
    onSuccess: (res: any) => {
      toast.success(res?.message ?? "Product added.");
      // Keep category + "show on main page" — reset the rest
      setForm((f) => ({
        ...EMPTY_FORM,
        category: f.category,
        featuredOnLanding: f.featuredOnLanding,
      }));
      setThumbOk(true);
      refreshFeatured();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to add product."),
  });

  const wholesale = Number(form.wholesalePrice);
  const canSubmit =
    form.name.trim().length > 0 &&
    form.wholesalePrice.trim() !== "" &&
    Number.isFinite(wholesale) &&
    wholesale > 0 &&
    !createMut.isPending;

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error("Enter a product name and a wholesale price.");
      return;
    }
    createMut.mutate();
  };

  // ── Unfeature ────────────────────────────────────────────────────────────
  const unfeatureMut = useMutation({
    mutationFn: ({ id }: { id: string }) => adminToggleFeaturedOnLanding(id, false),
    onSuccess: () => {
      toast.success("Removed from the main page.");
      refreshFeatured();
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update."),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <p className="eyebrow text-muted-foreground flex items-center gap-2">
          <span className="w-3 h-px bg-brass"></span> Product Hunting
        </p>
        <h2 className="font-display italic text-3xl lg:text-4xl mt-2 tracking-tight">
          Product Hunting<span className="text-brass">.</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Add a product you found and it goes live on the main page (Curated Picks) with retail
          pricing applied automatically. Unfeature anything you no longer want shown.
        </p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* ── Create form ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 border border-border rounded-xl overflow-hidden bg-card">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/30">
            <Package className="size-4 text-brass shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Add a product</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Wholesale price in PKR. Retail is worked out from it automatically.
              </p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Product name <span className="text-brass">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Foldable Bluetooth Keyboard"
                className={inputClass}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="e.g. Electronics"
                  list="product-hunting-categories"
                  className={inputClass}
                />
                <datalist id="product-hunting-categories">
                  {categories.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              {/* Wholesale price */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Wholesale price (PKR) <span className="text-brass">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={form.wholesalePrice}
                  onChange={(e) => set("wholesalePrice", e.target.value)}
                  placeholder="e.g. 1250"
                  className={inputClass}
                />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Retail is computed automatically: flat +Rs 270 when wholesale is under Rs 500,
                  otherwise the category markup applies.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Stock */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Stock</label>
                <input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.stock}
                  onChange={(e) => set("stock", e.target.value)}
                  placeholder="e.g. 10"
                  className={inputClass}
                />
              </div>

              {/* Weight */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={form.weight}
                  onChange={(e) => set("weight", e.target.value)}
                  placeholder="e.g. 0.8"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Image URL with live preview */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Image URL</label>
              <div className="relative">
                <input
                  value={form.imageUrl}
                  onChange={(e) => set("imageUrl", e.target.value)}
                  placeholder="https://…"
                  className={`${inputClass} ${form.imageUrl.trim() && thumbOk ? "pr-24" : ""}`}
                />
                {form.imageUrl.trim() && thumbOk && (
                  <img
                    src={form.imageUrl.trim().split(",")[0].split("?")[0]}
                    alt="Image preview"
                    onError={() => setThumbOk(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-16 rounded-md object-cover border border-border bg-secondary/50"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Short description shown on the product page"
                rows={3}
                className={`${inputClass} resize-y`}
              />
            </div>

            {/* Show on main page */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.featuredOnLanding}
                onChange={(e) => set("featuredOnLanding", e.target.checked)}
                className="size-4 accent-brass rounded cursor-pointer"
              />
              <span className="text-sm font-medium">Show on main page</span>
              <span className="text-xs text-muted-foreground">
                (Curated Picks — on by default)
              </span>
            </label>

            {/* Submit */}
            <div className="pt-1">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex items-center gap-2 bg-coal text-bone px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-coal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {createMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" strokeWidth={2} />
                )}
                {createMut.isPending ? "Adding…" : "Add product"}
              </button>
            </div>
          </div>
        </div>

        {/* ── On the main page ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 lg:sticky lg:top-24 border border-border rounded-xl overflow-hidden bg-card">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/30">
            <Target className="size-4 text-brass shrink-0" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">On the main page</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Curated Picks — what shoppers see on the home page.
              </p>
            </div>
            <span className="ml-auto shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-brass/10 text-brass border border-brass/25">
              <span className="size-1.5 rounded-full bg-brass" />
              {isLoading ? "…" : `${featuredCount} live`}
            </span>
          </div>

          {isLoading ? (
            <div className="p-4">
              <PanelTableSkeleton rows={5} cols={2} header={false} />
            </div>
          ) : featured.length === 0 ? (
            <div className="px-6 py-14 flex flex-col items-center text-center">
              <Inbox className="size-8 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">
                No products featured on the main page yet.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Add one from the form and it will show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {featured.map((p) => (
                <div key={p.id} className="px-4 py-3.5 flex items-center gap-3.5">
                  <div className="size-12 shrink-0 rounded-lg overflow-hidden border border-border bg-secondary/40 grid place-items-center">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                    ) : (
                      <Image className="size-4 text-muted-foreground/50" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate">
                      {p.category_name ?? "Uncategorized"}
                    </p>
                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug mt-0.5">
                      {p.name}
                    </p>
                    <p className="text-xs font-bold text-brass mt-0.5">
                      Rs {p.price.toLocaleString("en-PK")}
                    </p>
                  </div>
                  <button
                    onClick={() => unfeatureMut.mutate({ id: p.id })}
                    disabled={unfeatureMut.isPending}
                    title="Remove from main page"
                    className="size-8 shrink-0 flex items-center justify-center border border-brass/40 bg-brass/10 text-brass rounded-lg hover:bg-red-500/10 hover:border-red-400/50 hover:text-red-500 transition-all disabled:opacity-50"
                  >
                    {unfeatureMut.isPending && unfeatureMut.variables?.id === p.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Target className="size-3.5" strokeWidth={2} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
