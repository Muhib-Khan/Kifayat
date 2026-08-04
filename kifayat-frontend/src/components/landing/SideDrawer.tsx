import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { X, ArrowUpRight } from "lucide-react";
import { useDrawerOpen, uiStore } from "@/lib/ui-store";
import { useQuery } from "@tanstack/react-query";
import { listCategories } from "@/lib/shop.functions";

export function SideDrawer() {
  const open = useDrawerOpen();
  const close = () => uiStore.setDrawer(false);
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="drawer"
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
          className="fixed top-0 left-0 h-screen w-[88vw] sm:w-[440px] lg:w-[520px] z-[80] bg-coal text-bone overflow-y-auto will-change-transform"
        >
          <div className="flex items-center justify-between px-6 lg:px-10 h-16 lg:h-20 border-b border-bone/10">
            <span className="eyebrow text-bone/50">§ Index</span>
            <button onClick={close} aria-label="Close menu" className="size-10 -mr-2 grid place-items-center hover:bg-bone/10 transition rounded-full">
              <X className="size-5" strokeWidth={1.4} />
            </button>
          </div>

          <nav className="px-6 lg:px-10 py-10 lg:py-14">
            <p className="eyebrow text-bone/40 mb-6">Browse</p>
            <ul className="space-y-1">
              {categories.map((c, i) => (
                <li key={c.slug}>
                  <Link
                    to="/category/$slug"
                    params={{ slug: c.slug }}
                    onClick={close}
                    className="group flex items-baseline gap-5 py-3 border-b border-bone/10 hover:border-brass transition"
                  >
                    <span className="eyebrow text-bone/40 font-mono tabular-nums w-8">{String(i + 1).padStart(2, "0")}</span>
                    <span className="font-display italic text-4xl lg:text-5xl text-bone group-hover:text-brass transition tracking-tight">
                      {c.name}
                    </span>
                    <ArrowUpRight className="ml-auto size-5 text-bone/30 group-hover:text-brass group-hover:translate-x-1 group-hover:-translate-y-1 transition" strokeWidth={1.2} />
                  </Link>
                </li>
              ))}
            </ul>

            <p className="eyebrow text-bone/40 mb-4 mt-12">More</p>
            <ul className="space-y-3 font-display italic text-2xl">
              {[
                { to: "/products", label: "All objects" },
                { to: "/about", label: "Our story" },
                { to: "/contact", label: "Contact" },
                { to: "/report-defective", label: "Report defective" },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} onClick={close} className="text-bone/80 hover:text-brass transition link-draw">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

        </motion.aside>
      )}

      {open && (
        <motion.button
          key="scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={close}
          aria-label="Close menu"
          className="fixed inset-0 z-[70] bg-coal/30 backdrop-blur-[2px] cursor-pointer"
        />
      )}
    </AnimatePresence>
  );
}
