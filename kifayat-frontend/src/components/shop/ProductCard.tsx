import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, ArrowUpRight, Check } from "lucide-react";
import { isWishlisted, toggleWishlist } from "@/lib/account.functions";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";

export type CardProduct = {
  id?: string;
  slug: string;
  name: string;
  brand?: string | null;
  price: number;
  oldPrice?: number | null;
  image: string;
  badge?: string | null;
  inStock?: boolean;
};

export function ProductCard({ p, index }: { p: CardProduct; index?: number }) {
  const title = p.name;
  const wishKey = p.id || p.slug;
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["wishlisted", wishKey, user?._id],
    queryFn: () => isWishlisted(wishKey),
    enabled: !!user,
  });
  const wished = !!data?.wishlisted;

  async function toggleWish() {
    if (!user) {
      toast.error("Sign in to save items.");
      navigate({ to: "/auth" });
      return;
    }
    try {
      const res = await toggleWishlist(wishKey);
      toast.success(res.added ? "Added to wishlist." : "Removed from wishlist.");
      qc.invalidateQueries({ queryKey: ["wishlisted", wishKey] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not update wishlist.");
    }
  }

  return (
    <article className="group relative">
      <Link
        to="/products/$productId"
        params={{ productId: p.slug }}
        className="block"
        data-cursor="view"
      >
        <div className="relative aspect-[3/4] bg-paper overflow-hidden rounded-xl img-bone-grade">
          {p.image ? (
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              decoding="async"
              width={900}
              height={1200}
              className={`size-full object-cover img-breathe transition-transform duration-700 ease-out [@media(hover:hover)]:group-hover:scale-[1.06] ${p.inStock === false ? "grayscale opacity-70" : ""}`}
            />
          ) : (
            <div className="size-full bg-bone grid place-items-center">
              <span className="font-display italic text-[96px] leading-none text-coal/10 select-none">
                {(p.name || "K")[0].toUpperCase()}
              </span>
            </div>
          )}

          {/* sold-out overlay */}
          {p.inStock === false && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="eyebrow bg-coal text-bone px-3 py-1.5">Out of stock</span>
            </div>
          )}

          {/* top meta — index + badge */}
          {typeof index === "number" && (
            <span className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 eyebrow text-coal/80 bg-bone/85 px-2 py-1 font-mono">
              N° {String(index + 1).padStart(2, "0")}
            </span>
          )}
          {p.badge && p.inStock !== false && (
            <span className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 bg-brass text-coal eyebrow px-2.5 py-1">{p.badge}</span>
          )}

          {/* wishlist */}
          <button
            aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(); }}
            className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 size-8 sm:size-10 grid place-items-center bg-bone/85 text-coal hover:bg-coal hover:text-bone rounded-full transition
              opacity-100 @[supports(hover:hover)]:opacity-0 @[supports(hover:hover)]:translate-y-2
              group-hover:opacity-100 group-hover:translate-y-0 duration-500
              [@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-y-0
              pointer:opacity-0 pointer:translate-y-2"
          >
            <Heart className={`size-3.5 sm:size-4 ${wished ? "fill-brass text-brass" : ""}`} strokeWidth={1.4} />
          </button>

          {/* slide-up panel — desktop hover only; hidden on touch so it never
              renders as a black strip over the image on mobile */}
          <div className="absolute inset-x-0 bottom-0 hidden [@media(hover:hover)]:block
            translate-y-full group-hover:translate-y-0
            transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] bg-coal/95 text-bone backdrop-blur-sm">
            <div className="px-3.5 py-3 sm:px-5 sm:py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow text-bone/50 mb-1">{p.brand}</p>
                <p className="font-sans font-semibold text-xs sm:text-sm lg:text-base leading-snug truncate">{title}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-sm sm:text-lg lg:text-xl text-brass">Rs {p.price.toLocaleString()}</p>
                {p.oldPrice && <p className="text-[10px] text-bone/40 line-through">Rs {p.oldPrice.toLocaleString()}</p>}
              </div>
            </div>
            <div className="px-3.5 pb-3 sm:px-5 sm:pb-4 flex items-center justify-between eyebrow text-bone/60">
              <span>View object</span>
              <ArrowUpRight className="size-3.5 text-brass" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </Link>

      {/* caption */}
      <div className="mt-2.5 sm:mt-3.5 flex items-start justify-between gap-3 transition-opacity duration-500 group-hover:opacity-0">
        <div className="min-w-0">
          <p className="eyebrow text-coal/35 mb-1 text-[10px]">{p.brand}</p>
          <Link
            to="/products/$productId"
            params={{ productId: p.slug }}
            className="block font-sans font-medium text-xs sm:text-sm lg:text-base leading-snug truncate hover:text-brass transition-colors"
          >
            {title}
          </Link>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display italic text-sm sm:text-base lg:text-lg">Rs {p.price.toLocaleString()}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[9px] text-coal/40 whitespace-nowrap">
            <Check className="size-2.5 text-brass" strokeWidth={2} /> COD
          </p>
        </div>
      </div>
    </article>
  );
}
