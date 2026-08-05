import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { listProducts } from "@/lib/shop.functions";
import { resolveImage } from "@/lib/product-image-map";

const FEATURES = [
  { Icon: Truck,       title: "Pakistan-wide delivery", body: "2–5 working days" },
  { Icon: ShieldCheck, title: "Cash on delivery",       body: "Pay the courier" },
  { Icon: RotateCcw,   title: "7-day returns",          body: "Easy return policy" },
  { Icon: Headphones,  title: "Local support",          body: "Email & WhatsApp" },
];

const MARQUEE_ITEMS = ["Electronics", "·", "Fashion", "·", "Home & Kitchen", "·", "Beauty", "·", "Sports", "·", "New Arrivals", "·"];

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { data: leftProducts = [], isLoading: loadingLeft } = useQuery({
    queryKey: ["hero", "left"],
    queryFn: () => listProducts({ search: "track suit trouser set", limit: 1 }),
    staleTime: 60_000,
  });

  const { data: rightProducts = [], isLoading: loadingRight } = useQuery({
    queryKey: ["hero", "right"],
    queryFn: () => listProducts({ search: "earbuds", limit: 1 }),
    staleTime: 60_000,
  });

  const [leftProduct] = leftProducts;
  const [rightProduct] = rightProducts;
  const isLoading = loadingLeft || loadingRight;

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const sp = useSpring(scrollYProgress, { stiffness: 80, damping: 26, mass: 0.2 });

  const yL     = useTransform(sp, [0, 1], ["0%", "-16%"]);
  const yR     = useTransform(sp, [0, 1], ["0%", "-24%"]);
  const titleY = useTransform(sp, [0, 1], ["0%", "-10%"]);

  return (
    <section ref={ref} className="relative bg-bone text-coal overflow-hidden">

      {/* ── TOP META BAR ─────────────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto px-5 lg:px-10 pt-8 lg:pt-12 flex items-center justify-between eyebrow text-coal/50">
        <span className="flex items-center gap-3">
          <span className="h-px w-8 bg-coal/25 shrink-0" />
          Volume 03 · Autumn Edit
        </span>
        <span className="hidden sm:block">Ships nationwide</span>
        <span className="hidden md:flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-brass animate-pulse" />
          Live inventory
        </span>
      </div>

      {/* ── MAIN DIPTYCH ─────────────────────────────────────────────── */}
      <div className="relative max-w-[1600px] mx-auto px-5 lg:px-10 pt-6 lg:pt-10">

        {/* Vertical edition label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.6 }}
          className="hidden xl:block absolute left-10 bottom-32 eyebrow text-coal/30 text-[9px] tracking-[0.35em] select-none"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          S01 — E03 — PKR — COD
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-end min-h-[50dvh] lg:min-h-[88vh]">

          {/* LEFT IMAGE */}
          <motion.figure
            initial={reduce ? false : { opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block lg:col-span-4 aspect-[3/4.2] bg-paper overflow-hidden relative self-end img-bone-grade"
            data-cursor="view"
          >
            {leftProduct ? (
              <motion.img
                style={reduce ? undefined : { y: yL }}
                src={resolveImage(leftProduct.image_url, leftProduct.slug)}
                alt={leftProduct.name}
                fetchPriority="high"
                decoding="async"
                className="size-full object-contain will-change-transform"
              />
            ) : (
              <div className={`size-full ${isLoading ? "animate-pulse bg-bone/50" : "bg-paper"}`} />
            )}
            {/* label */}
            <span className="absolute top-5 left-5 eyebrow text-bone bg-coal/80 px-2.5 py-1 text-[10px]">
              {leftProduct ? `01 / ${leftProduct.name}` : "01 / Object"}
            </span>
            {/* thin bottom rule */}
            <motion.span
              className="absolute bottom-0 left-0 h-0.5 bg-brass"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.figure>

          {/* CENTER — headline + CTA only */}
          <motion.div
            style={reduce ? undefined : { y: titleY }}
            className="lg:col-span-4 order-first lg:order-none flex flex-col items-center justify-end lg:pb-10 text-center will-change-transform relative z-10 gap-8 lg:gap-10"
          >
            {/* eyebrow */}
            <motion.p
              className="eyebrow text-coal/45 tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Season 01 — Edition
            </motion.p>

            {/* headline */}
            <h1 className="font-display italic leading-[0.86] tracking-tight text-[18vw] sm:text-[13vw] lg:text-[8.5vw] xl:text-[7.8vw]">
              {(["Objects,", "considered."] as const).map((word, i) => (
                <span key={word} className="block overflow-hidden">
                  <motion.span
                    className={`inline-block ${i === 1 ? "text-brass" : ""}`}
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 1.15, delay: 0.3 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {word}
                  </motion.span>
                </span>
              ))}
            </h1>

            {/* sub-line */}
            <motion.p
              className="text-coal/55 text-sm lg:text-[15px] leading-relaxed max-w-[22ch] mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.85 }}
            >
              Quality essentials, fairly priced — dispatched Pakistan-wide.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-col items-center gap-4 w-full"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.05 }}
            >
              {/* Primary — brass sweep fill */}
              <Link
                to="/products"
                data-cursor="view"
                className="group relative inline-flex items-center justify-between gap-6 bg-coal text-bone w-full max-w-[280px] px-8 py-[15px] eyebrow overflow-hidden"
              >
                {/* brass fill slides in from left on hover */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-brass translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                />
                <span className="relative z-10 transition-colors duration-300 group-hover:text-coal tracking-widest">
                  Explore the Edit
                </span>
                <ArrowRight
                  className="relative z-10 size-4 shrink-0 transition-all duration-300 group-hover:translate-x-1 group-hover:text-coal"
                  strokeWidth={1.25}
                />
              </Link>

              {/* Secondary — minimal text link */}
              <Link
                to="/products"
                className="group inline-flex items-center gap-1.5 eyebrow text-coal/45 hover:text-coal transition-colors duration-200 text-[11px]"
              >
                All products
                <ArrowUpRight
                  className="size-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
                  strokeWidth={1.5}
                />
              </Link>
            </motion.div>

            {/* mobile image (replaces diptych on small screens) */}
            <motion.figure
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="lg:hidden w-full aspect-[4/3] bg-paper overflow-hidden relative img-bone-grade"
            >
              {rightProduct ? (
                <img
                  src={resolveImage(rightProduct.image_url, rightProduct.slug)}
                  alt={rightProduct.name}
                  fetchPriority="high"
                  decoding="async"
                  className="size-full object-contain"
                />
              ) : (
                <div className={`size-full ${isLoading ? "animate-pulse bg-bone/50" : "bg-paper"}`} />
              )}
              <span className="absolute top-4 left-4 eyebrow text-bone bg-coal/80 px-2.5 py-1 text-[10px]">Autumn Edit</span>
            </motion.figure>
          </motion.div>

          {/* RIGHT IMAGE */}
          <motion.figure
            initial={reduce ? false : { opacity: 0, y: 70 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block lg:col-span-4 aspect-[3/4.6] bg-paper overflow-hidden relative self-start lg:-mt-8 img-bone-grade"
            data-cursor="view"
          >
            {rightProduct ? (
              <motion.img
                style={reduce ? undefined : { y: yR }}
                src={resolveImage(rightProduct.image_url, rightProduct.slug)}
                alt={rightProduct.name}
                fetchPriority="high"
                decoding="async"
                className="size-full object-contain will-change-transform"
              />
            ) : (
              <div className={`size-full ${isLoading ? "animate-pulse bg-bone/50" : "bg-paper"}`} />
            )}
            <span className="absolute top-5 right-5 eyebrow text-bone bg-coal/80 px-2.5 py-1 text-[10px]">
              {rightProduct ? `02 / ${rightProduct.name}` : "02 / Pairing"}
            </span>
            <span className="absolute bottom-5 right-5 eyebrow bg-brass text-coal px-3 py-1.5 text-[10px]">
              {rightProduct ? `PKR ${Math.round(rightProduct.price).toLocaleString()}` : "Autumn N° 03"}
            </span>
          </motion.figure>
        </div>

        {/* ── FEATURES STRIP ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 1.25 }}
          className="mt-10 lg:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-px bg-coal/10 border border-coal/10"
        >
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="bg-bone flex items-start gap-3.5 px-5 py-5 lg:px-6 lg:py-6 group">
              <Icon className="size-4 text-brass mt-0.5 shrink-0" strokeWidth={1.5} aria-hidden />
              <div>
                <p className="eyebrow text-[10px] sm:text-[11px] leading-tight">{title}</p>
                <p className="text-[11px] sm:text-xs text-coal/50 mt-1 leading-snug">{body}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── MARQUEE STRIP ────────────────────────────────────────────── */}
      <div className="bg-coal text-bone py-[18px] overflow-hidden">
        <div className="flex gap-12 whitespace-nowrap animate-marquee font-display italic text-3xl lg:text-4xl xl:text-5xl">
          {[0, 1].map((k) => (
            <div key={k} className="flex gap-12 shrink-0 pr-12">
              {MARQUEE_ITEMS.map((w, i) => (
                <span key={i} className={w === "·" ? "text-brass text-xl self-center" : ""}>{w}</span>
              ))}
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
