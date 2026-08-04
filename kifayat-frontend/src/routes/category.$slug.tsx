import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/landing/PageShell";
import { ProductCard } from "@/components/shop/ProductCard";
import { useQuery } from "@tanstack/react-query";
import { listProducts, listCategories } from "@/lib/shop.functions";
import { useState, useEffect, useMemo } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { SEO, SITE_URL } from "@/components/seo/SEO";
import { BreadcrumbSchema, ItemListSchema, CollectionPageSchema } from "@/components/seo/JsonLd";
import { ProductGridSkeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/category/$slug")({
  component: CategoryPage,
});

const SORTS = [
  { value: "", label: "Default" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "trending", label: "Trending" },
];

function PriceSlider({
  min, max, value, onChange,
}: {
  min: number; max: number; value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  if (max <= min) return null;
  return (
    <SliderPrimitive.Root
      min={min} max={max} step={100}
      value={value}
      onValueChange={(v) => onChange(v as [number, number])}
      className="relative flex items-center w-full select-none touch-none h-5"
    >
      <SliderPrimitive.Track className="relative h-px w-full bg-coal/20 grow">
        <SliderPrimitive.Range className="absolute h-full bg-brass" />
      </SliderPrimitive.Track>
      {[0, 1].map((i) => (
        <SliderPrimitive.Thumb
          key={i}
          className="block size-3.5 bg-brass border-2 border-brass shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/50 cursor-grab active:cursor-grabbing transition-transform hover:scale-110"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

function CategoryPage() {
  const { slug } = Route.useParams();

  const [sort, setSort] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [priceReady, setPriceReady] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    staleTime: 5 * 60 * 1000,
  });

  const categoryName = useMemo(() => {
    const match = categories.find((c) => c.slug === slug);
    return match?.name ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }, [categories, slug]);

  const { data: allProducts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["products", "category", slug, sort],
    queryFn: () => listProducts({ categorySlug: slug, sort, limit: 200 }),
  });

  const [globalMin, globalMax] = useMemo(() => {
    if (!allProducts.length) return [0, 0];
    const prices = allProducts.map((p) => p.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [allProducts]);

  useEffect(() => {
    if (globalMax > 0 && !priceReady) {
      setPriceRange([globalMin, globalMax]);
      setPriceReady(true);
    }
  }, [globalMin, globalMax, priceReady]);

  useEffect(() => {
    setPriceReady(false);
    setPriceRange([0, 0]);
    setSort("");
  }, [slug]);

  const products = useMemo(() => {
    if (!priceReady) return allProducts;
    return allProducts.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
  }, [allProducts, priceRange, priceReady]);

  const hasFilters = sort || (priceReady && (priceRange[0] > globalMin || priceRange[1] < globalMax));

  function clearAll() {
    setSort("");
    if (priceReady) setPriceRange([globalMin, globalMax]);
  }

  const itemListItems = products.map((p: any) => ({
    name: p.name,
    url: `${SITE_URL}/products/${p.id}`,
  }));
  const categoryDesc = `Shop ${categoryName} online in Pakistan at Kifayat. Quality ${categoryName.toLowerCase()} products with fast delivery all across Pakistan and free shipping on orders over Rs\u00a02,500.`;

  return (
    <PageShell>
      <SEO
        title={`${categoryName} — Shop Online in Pakistan`}
        description={categoryDesc}
        path={`/category/${slug}`}
        keywords={`${categoryName} online Pakistan, buy ${categoryName.toLowerCase()} Karachi, ${categoryName.toLowerCase()} shop Pakistan`}
      />
      <CollectionPageSchema
        name={`${categoryName} — Kifayat`}
        description={categoryDesc}
        url={`${SITE_URL}/category/${slug}`}
        itemCount={products.length}
      />
      <BreadcrumbSchema
        crumbs={[
          { name: "Home", url: SITE_URL },
          { name: "Products", url: `${SITE_URL}/products` },
          { name: categoryName, url: `${SITE_URL}/category/${slug}` },
        ]}
      />
      {products.length > 0 && (
        <ItemListSchema
          items={products.slice(0, 20).map((p: any) => ({
            name: p.name,
            url: `${SITE_URL}/products/${p.slug || p.id}`,
            image: p.image_url || undefined,
            price: p.price,
          }))}
          url={`${SITE_URL}/category/${slug}`}
        />
      )}
      <PageHeader
        title={categoryName}
        subtitle={`Curated objects · ${categoryName}.`}
        breadcrumbs={[
          { label: "Home", to: "/" },
          { label: "Products", to: "/products" },
          { label: categoryName },
        ]}
      />

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <section className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 lg:py-10">
        <div className="flex gap-8 items-start">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-52 shrink-0 sticky top-[176px] space-y-8">
            <div>
              <p className="eyebrow text-coal/40 text-xs mb-3">Sort by</p>
              <ul className="space-y-1">
                {SORTS.map((s) => (
                  <li key={s.value}>
                    <button
                      onClick={() => setSort(s.value)}
                      className={`w-full text-left text-sm py-1.5 transition flex items-center justify-between ${
                        sort === s.value ? "text-brass font-medium" : "text-coal/60 hover:text-coal"
                      }`}
                    >
                      {s.label}
                      {sort === s.value && <span className="size-1.5 rounded-full bg-brass" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {priceReady && globalMax > globalMin && (
              <div>
                <p className="eyebrow text-coal/40 text-xs mb-4">Price range</p>
                <PriceSlider min={globalMin} max={globalMax} value={priceRange} onChange={setPriceRange} />
                <div className="flex justify-between mt-3 text-xs text-coal/60 font-mono tabular-nums">
                  <span>Rs {priceRange[0].toLocaleString()}</span>
                  <span>Rs {priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            )}

            {categories.length > 0 && (
              <div>
                <p className="eyebrow text-coal/40 text-xs mb-3">Other categories</p>
                <ul className="space-y-0.5">
                  {categories.filter((c) => c.slug !== slug).map((c) => (
                    <li key={c.slug}>
                      <Link
                        to="/category/$slug"
                        params={{ slug: c.slug }}
                        className="flex items-center justify-between group py-1.5 text-sm text-coal/60 hover:text-coal transition"
                      >
                        <span>{c.name}</span>
                        <span className="size-1 rounded-full bg-coal/15 group-hover:bg-brass transition" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasFilters && (
              <button onClick={clearAll} className="eyebrow text-xs text-coal/40 hover:text-brass transition flex items-center gap-1.5">
                <X className="size-3" strokeWidth={2} /> Clear filters
              </button>
            )}
          </aside>

          {/* Main column */}
          <div className="flex-1 min-w-0">
            {/* Mobile controls */}
            <div className="flex items-center gap-3 mb-5 lg:hidden">
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className="inline-flex items-center gap-2 eyebrow text-xs border border-coal/20 px-3 py-2 hover:border-coal transition"
              >
                <SlidersHorizontal className="size-3.5" strokeWidth={1.5} />
                Filters
              </button>
              <div className="flex gap-2 overflow-x-auto pb-1 flex-1 scrollbar-none">
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSort(s.value)}
                    className={`shrink-0 eyebrow text-xs px-3 py-2 border transition ${
                      sort === s.value ? "border-coal bg-coal text-bone" : "border-coal/15 text-coal/60 hover:border-coal"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile filter panel */}
            {filtersOpen && (
              <div className="lg:hidden border border-coal/10 bg-bone/40 p-5 mb-5 space-y-6">
                {priceReady && globalMax > globalMin && (
                  <div>
                    <p className="eyebrow text-coal/40 text-xs mb-4">Price range</p>
                    <PriceSlider min={globalMin} max={globalMax} value={priceRange} onChange={setPriceRange} />
                    <div className="flex justify-between mt-3 text-xs text-coal/60 font-mono tabular-nums">
                      <span>Rs {priceRange[0].toLocaleString()}</span>
                      <span>Rs {priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {categories.length > 0 && (
                  <div>
                    <p className="eyebrow text-coal/40 text-xs mb-3">Other categories</p>
                    <div className="flex flex-wrap gap-2">
                      {categories.filter((c) => c.slug !== slug).map((c) => (
                        <Link
                          key={c.slug}
                          to="/category/$slug"
                          params={{ slug: c.slug }}
                          onClick={() => setFiltersOpen(false)}
                          className="eyebrow text-xs border border-coal/15 px-3 py-1.5 hover:border-brass hover:text-brass transition"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {hasFilters && (
                  <button onClick={clearAll} className="eyebrow text-xs text-coal/40 hover:text-brass transition flex items-center gap-1.5">
                    <X className="size-3" strokeWidth={2} /> Clear all
                  </button>
                )}
              </div>
            )}

            {/* Count row */}
            <div className="flex items-center justify-between mb-6">
              {isLoading ? (
                <span className="eyebrow text-coal/40 text-xs">Loading…</span>
              ) : (
                <span className="eyebrow text-coal/40 text-xs">
                  {products.length} {products.length === 1 ? "object" : "objects"}
                </span>
              )}
              {hasFilters && (
                <button onClick={clearAll} className="hidden lg:flex items-center gap-1.5 eyebrow text-xs text-coal/40 hover:text-brass transition">
                  <X className="size-3" strokeWidth={2} /> Clear filters
                </button>
              )}
            </div>

            {/* Grid */}
            {products.length === 0 && !isLoading ? (
              isError ? (
                <div className="text-center py-24 border border-dashed border-coal/10">
                  <p className="font-display italic text-3xl text-coal/30 mb-4">The store is waking up<span className="text-brass">.</span></p>
                  <p className="text-sm text-coal/55 mb-6">We couldn't load this category — try again in a moment.</p>
                  <button
                    onClick={() => refetch()}
                    className="eyebrow text-xs border border-coal/20 px-5 py-2.5 hover:bg-coal hover:text-bone transition"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="text-center py-24 border border-dashed border-coal/10">
                  <p className="font-display italic text-3xl text-coal/30 mb-4">Nothing found.</p>
                  <button onClick={clearAll} className="eyebrow text-xs text-coal/50 hover:text-coal underline transition">
                    Clear all filters
                  </button>
                </div>
              )
            ) : isLoading ? (
              <ProductGridSkeleton count={8} columns="grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-5 lg:gap-5" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-5 lg:gap-5">
                {products.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    index={i}
                    p={{
                      id: p.id,
                      slug: p.slug,
                      name: p.name,
                      brand: p.brand,
                      price: p.price,
                      oldPrice: p.old_price,
                      image: p.image_url || "",
                      badge: p.badge,
                      inStock: p.inStock,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
