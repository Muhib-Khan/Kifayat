import { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { MobileNav } from "@/components/landing/MobileNav";
import { SideDrawer } from "@/components/landing/SideDrawer";
import { useDrawerOpen } from "@/lib/ui-store";

const BlendCursor = lazy(() => import("@/components/landing/BlendCursor").then((m) => ({ default: m.BlendCursor })));

export function PageShell({ children }: { children: React.ReactNode }) {
  const open = useDrawerOpen();

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-clip">
      <SideDrawer />
      <Suspense fallback={null}><BlendCursor /></Suspense>
      <motion.div
        animate={{ x: open ? "min(420px, 70vw)" : 0, scale: open ? 0.985 : 1 }}
        transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
        className="flex flex-col flex-1 will-change-transform origin-left"
      >
        <Header />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <Footer />
      </motion.div>
      <MobileNav />
    </div>
  );
}

export function PageHeader({ title, subtitle, breadcrumbs }: { title: string; subtitle?: string; breadcrumbs?: { label: string; to?: string }[] }) {
  return (
    <section className="bg-secondary/40 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
        {breadcrumbs && (
          <nav className="text-xs text-muted-foreground mb-3 flex gap-1.5 flex-wrap">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {b.to ? <a href={b.to} className="hover:text-primary">{b.label}</a> : <span>{b.label}</span>}
                {i < breadcrumbs.length - 1 && <span>/</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-3xl lg:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground max-w-2xl">{subtitle}</p>}
      </div>
    </section>
  );
}
