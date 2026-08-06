import { Link, useNavigate } from "@tanstack/react-router";
import {
  ShoppingBag, User, LogOut, ShieldCheck, X, Truck, RotateCcw,
  Monitor, Shirt, Home as HomeIcon, Sparkles, Dumbbell, Tag, LayoutGrid, Menu, Search,

} from "lucide-react";
import { uiStore } from "@/lib/ui-store";
import { useAuth, signOut } from "@/lib/auth-store";
import { useCart, cartTotals, FLAT_DELIVERY_FEE, fetchDeliveryFee } from "@/lib/cart-store";
import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchSuggest } from "@/lib/search.functions";
import { listCategories } from "@/lib/shop.functions";
import { motion, AnimatePresence } from "framer-motion";

// ─── Static fallback category strip ───────────────────────────────────────────
const FALLBACK_CATS = [
  { slug: "electronics",  label: "Electronics",   Icon: Monitor   },
  { slug: "fashion",      label: "Fashion",        Icon: Shirt     },
  { slug: "home-kitchen", label: "Home & Kitchen", Icon: HomeIcon  },
  { slug: "beauty",       label: "Beauty",         Icon: Sparkles  },
  { slug: "sports",       label: "Sports",         Icon: Dumbbell  },
  { slug: "toys",         label: "Toys",           Icon: LayoutGrid},
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  electronics: Monitor,
  fashion: Shirt,
  "home-kitchen": HomeIcon,
  beauty: Sparkles,
  sports: Dumbbell,
  toys: LayoutGrid,
};

// ─── Inline search bar ─────────────────────────────────────────────────────────
function HeaderSearch() {
  const navigate  = useNavigate();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const { data } = useQuery({
    queryKey: ["header-suggest", debouncedQ],
    queryFn: () => searchSuggest(debouncedQ),
    enabled: debouncedQ.length >= 2,
    staleTime: 30_000,
  });

  const hasSuggestions =
    debouncedQ.length >= 2 && (data?.queries?.length || data?.products?.length);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    navigate({ to: "/search", search: { q: term } as any });
    setQ(""); setOpen(false);
  }

  function go(term: string) {
    navigate({ to: "/search", search: { q: term } as any });
    setQ(""); setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative flex-1 min-w-0 max-w-2xl">
      <form onSubmit={submit} className="flex min-w-0">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search products, brands, categories…"
          className="w-full min-w-0 h-11 pl-3 sm:pl-5 pr-2 sm:pr-4 border-2 border-coal/20 bg-paper focus:border-coal outline-none text-xs sm:text-sm transition-colors placeholder:text-coal/40"
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); setOpen(false); }}
             className="absolute right-[56px] sm:right-[88px] top-1/2 -translate-y-1/2 p-2 text-coal/40 hover:text-coal transition">
            <X className="size-3.5" strokeWidth={1.5} />
          </button>
        )}
        <button type="submit"
           className="shrink-0 h-11 px-3 sm:px-6 bg-coal text-bone eyebrow text-xs hover:bg-brass hover:text-coal transition-colors duration-300">
           <Search className="size-4 sm:hidden" strokeWidth={1.5} />
           <span className="hidden sm:inline">Search</span>
        </button>
      </form>

      <AnimatePresence>
        {open && hasSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full left-0 right-0 z-50 bg-bone border border-coal/15 shadow-xl mt-0.5"
          >
            <div className="p-4 grid sm:grid-cols-2 gap-5">
              {data?.queries && data.queries.length > 0 && (
                <div>
                  <p className="eyebrow text-coal/40 text-[10px] mb-2">Suggestions</p>
                  <ul className="space-y-0.5">
                    {data.queries.slice(0, 5).map((s) => (
                      <li key={s} className="min-w-0">
                        <button onClick={() => go(s)}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-paper transition flex items-center gap-2">
                          <span className="text-brass text-xs shrink-0">→</span>
                          <span className="min-w-0 truncate">{s}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data?.products && data.products.length > 0 && (
                <div>
                  <p className="eyebrow text-coal/40 text-[10px] mb-2">Products</p>
                  <ul className="space-y-0.5">
                    {data.products.slice(0, 4).map((p: any) => (
                      <li key={p.slug}>
                        <Link to="/products/$productId" params={{ productId: p.slug }}
                          onClick={() => { setQ(""); setOpen(false); }}
                          className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-paper transition">
                          {p.image_url
                            ? <img src={p.image_url} alt="" className="size-8 object-cover bg-paper shrink-0" />
                            : <div className="size-8 bg-paper shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{p.name}</p>
                            <p className="eyebrow text-coal/40 text-[10px]">
                              Rs {Number(p.price).toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Account dropdown ──────────────────────────────────────────────────────────
function AccountDropdown() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function click(e: MouseEvent) {
      if (open && ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    window.addEventListener("mousedown", click);
    return () => window.removeEventListener("mousedown", click);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="Account"
        className="flex flex-col items-center gap-0.5 p-2.5 -m-1 hover:text-brass transition-colors group">
        <User className="size-5" strokeWidth={1.2} />
        <span className="eyebrow text-[9px] hidden sm:block text-coal/60 group-hover:text-brass transition-colors">
          {user ? "Account" : "Sign In"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full mt-2 w-64 bg-bone border border-coal/15 shadow-xl z-50 py-2"
          >
            {user ? (
              <>
                <div className="px-4 py-3 border-b border-coal/10">
                  <p className="eyebrow text-muted-foreground text-[10px]">Signed in as</p>
                  <p className="font-display italic text-base truncate mt-0.5">{user.email}</p>
                </div>
                <Link to="/account/orders"   onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-paper transition">My orders</Link>
                <Link to="/account/wishlist" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-paper transition">Wishlist</Link>
                <Link to="/account/addresses" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-paper transition">Addresses</Link>
                <Link to="/account"          onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-paper transition">Account</Link>
                {user.role === "admin" && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-paper transition">
                    <ShieldCheck className="size-4" strokeWidth={1.4} /> Admin
                  </Link>
                )}
                <button
                  onClick={async () => { setOpen(false); await signOut(); navigate({ to: "/" }); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-paper transition border-t border-coal/10 mt-1"
                >
                  <LogOut className="size-4" strokeWidth={1.4} /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-paper transition">Sign in</Link>
                <Link to="/auth" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-paper transition">Create account</Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Category strip ────────────────────────────────────────────────────────────
function CategoryStrip() {
  const { data: dbCats = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    staleTime: 30_000,
  });

  // Use DB categories if present, otherwise fall back to keyword-based defaults
  const cats = dbCats.length > 0
    ? dbCats.slice(0, 8).map((c) => ({
        slug: c.slug,
        label: c.name,
        Icon: ICON_MAP[c.slug] ?? LayoutGrid,
      }))
    : FALLBACK_CATS;

  return (
    <div className="bg-bone border-b border-coal/8">
       <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
          {cats.map(({ slug, label, Icon }) => (
            <Link
              key={slug}
              to="/category/$slug"
              params={{ slug }}
              className="group flex items-center gap-1.5 px-3 py-3 min-h-11 eyebrow text-[10px] sm:text-xs text-coal/65 hover:text-coal hover:bg-paper whitespace-nowrap transition-colors shrink-0 border-b-2 border-transparent hover:border-brass"
            >
              <Icon className="size-3.5 group-hover:text-brass transition-colors" strokeWidth={1.5} />
              {label}
            </Link>
          ))}
          <div className="w-px h-4 bg-coal/10 mx-1 shrink-0" />
          <Link
            to="/products"
             className="flex items-center gap-1.5 px-3 py-3 min-h-11 eyebrow text-[10px] sm:text-xs text-brass whitespace-nowrap transition-colors shrink-0 font-semibold hover:opacity-75"
          >
            <Tag className="size-3.5" strokeWidth={1.5} />
            All Deals
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main header ───────────────────────────────────────────────────────────────
export function Header() {
  const items       = useCart();
  const { count }   = cartTotals(items);
  const { user }    = useAuth();

  // ── Admin-editable delivery fee (falls back to FLAT_DELIVERY_FEE) ─────────
  const [deliveryFee, setDeliveryFee] = useState<number>(FLAT_DELIVERY_FEE);
  useEffect(() => {
    let alive = true;
    fetchDeliveryFee().then((fee) => {
      if (alive) setDeliveryFee(fee);
    });
    return () => {
      alive = false;
    };
  }, []);

  // ── Auto-hide on scroll down, reveal on scroll up ──────────────────────────
  const [hidden, setHidden]   = useState(false);
  const lastY   = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 80) {
          setHidden(false);                     // always visible near top
        } else if (y > lastY.current + 8) {
          setHidden(true);                      // scrolling down → hide
        } else if (y < lastY.current - 8) {
          setHidden(false);                     // scrolling up → reveal
        }
        lastY.current = y;
        ticking.current = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      className="sticky top-0 z-50 will-change-transform"
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Top banner ── */}
      <div className="bg-coal text-bone">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 h-9 flex items-center justify-between eyebrow text-[11px]">
          <span className="hidden sm:inline opacity-75">
            Rs {deliveryFee} delivery — Cheapest Delivery in Pakistan
          </span>
          <span className="sm:hidden opacity-75">
            Cheapest Delivery in Pakistan
          </span>
          <div className="flex items-center gap-5 opacity-75">
            <span className="hidden sm:inline">COD available · PKR</span>
            <Link to="/contact" className="hover:opacity-100 transition hover:text-brass">
              Help
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main nav ── */}
      <div className="bg-bone/95 backdrop-blur-xl border-b border-coal/8">
         <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-8 h-16 lg:h-[4.5rem] flex items-center gap-2 sm:gap-3 lg:gap-5">

          {/* Drawer toggle */}
          <button
            onClick={() => uiStore.toggleDrawer()}
            aria-label="Open menu"
             className="shrink-0 size-10 grid place-items-center p-1.5 hover:text-brass transition-colors text-coal/70 hover:bg-paper rounded-sm"
          >
            <Menu className="size-5" strokeWidth={1.2} />
          </button>

          {/* Logo */}
           <Link to="/" className="shrink-0 font-display italic text-xl sm:text-2xl lg:text-3xl tracking-tight leading-none">
            Kifayat<span className="text-brass">.</span>
          </Link>

          {/* Search bar */}
          <HeaderSearch />

          {/* Right icons */}
          <div className="flex items-center gap-3 lg:gap-4 shrink-0">
            <AccountDropdown />
            <Link to="/cart" aria-label="Cart" data-cart-icon
              className="flex flex-col items-center gap-0.5 p-2.5 -m-1 relative hover:text-brass transition-colors group">
              <ShoppingBag className="size-5" strokeWidth={1.2} />
              <span className="eyebrow text-[9px] hidden sm:block text-coal/60 group-hover:text-brass transition-colors">
                Cart
              </span>
              {count > 0 && (
                <span className="absolute -top-0.5 left-5 size-4 rounded-full bg-brass text-coal text-[9px] font-bold grid place-items-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Category strip ── */}
      <CategoryStrip />
      <div className="hidden lg:block bg-paper border-b border-coal/8">
        <div className="max-w-[1600px] mx-auto px-8 h-9 flex items-center justify-center gap-8 eyebrow text-[10px] text-coal/55">
          <span className="inline-flex items-center gap-1.5"><Truck className="size-3 text-brass" strokeWidth={1.5} /> Pakistan-wide delivery</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3 text-brass" strokeWidth={1.5} /> Cash on delivery</span>
          <span className="inline-flex items-center gap-1.5"><RotateCcw className="size-3 text-brass" strokeWidth={1.5} /> 7-day returns</span>
        </div>
      </div>
    </motion.header>
  );
}
