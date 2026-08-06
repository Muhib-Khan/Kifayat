import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Activity, AlertTriangle, BrainCircuit, ChartBar, Database, MessageSquareHeart, Menu, Package, RefreshCw, Settings, ShoppingBag, Star, Target, Ticket, Users, Wrench, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/lib/auth-store";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ context }) => {
    const user = (context as any)?.user;
    if (!user || user.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

const nav = [
  { to: "/admin/", label: "Dashboard", icon: ChartBar },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/low-stock", label: "Low Stock", icon: AlertTriangle },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/product-hunting", label: "Product Hunting", icon: Target },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/defect-reports", label: "Defect Reports", icon: ShieldAlert },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/activity-logs", label: "Activity Logs", icon: Activity },
  { to: "/admin/website-reviews", label: "Site Reviews", icon: MessageSquareHeart },
  { to: "/admin/vouchers", label: "Vouchers", icon: Ticket },
  { to: "/admin/user-data", label: "User Data", icon: Database },
  { to: "/admin/ai",         label: "AI Studio",  icon: BrainCircuit },
  { to: "/admin/diagnostic", label: "Diagnostic", icon: Wrench },
  { to: "/admin/hhc",        label: "HHC Sync",   icon: RefreshCw },
  { to: "/admin/settings",   label: "Settings",   icon: Settings },
];

function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const currentLabel =
    nav.find(({ to }) =>
      to === "/admin/" ? path === "/admin/" || path === "/admin" : path.startsWith(to)
    )?.label ?? "Admin";

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* ── Mobile top bar ───────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-4 shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          className="size-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="size-5 text-foreground" />
        </button>
        <span className="font-display font-bold text-lg tracking-tight">
          {currentLabel}<span className="text-brass">.</span>
        </span>
        {/* spacer to keep title centred */}
        <div className="size-9" />
      </div>

      {/* ── Mobile slide-out drawer ───────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[min(18rem,86vw)] bg-background border-r border-border shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
                <span className="font-display font-bold text-xl tracking-tight">
                  Admin<span className="text-brass">.</span>
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="size-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>
              <p className="px-5 pt-4 pb-1 eyebrow text-muted-foreground text-[10px]">Control room</p>
              {user && (
                <div className="mx-3 mb-2 rounded-xl border border-border bg-secondary/50 p-3 flex items-center gap-3">
                  <div className="size-9 shrink-0 rounded-full bg-coal text-bone grid place-items-center font-display font-bold text-sm">
                    {user.name?.[0]?.toUpperCase() ?? "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                      {user.title || (user.role === "admin" ? "Administrator" : user.role)}
                    </p>
                  </div>
                </div>
              )}
              <nav className="flex flex-col gap-1 px-3 pb-6 flex-1 overflow-y-auto">
                {nav.map(({ to, label, icon: Icon }) => {
                  const active = to === "/admin/" ? path === "/admin/" || path === "/admin" : path.startsWith(to);
                  return (
                    <Link
                      key={to}
                      to={to as never}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 h-11 text-sm font-medium rounded-lg transition-all ${
                        active
                          ? "bg-coal text-bone"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon
                        className={`size-4 shrink-0 ${active ? "text-brass" : "text-muted-foreground"}`}
                        strokeWidth={active ? 2.5 : 1.5}
                      />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Page body ─────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 lg:py-12 overflow-x-clip">
        {/* Desktop heading — hidden on mobile (mobile bar handles it) */}
        <div className="hidden lg:block mb-12">
          <p className="eyebrow text-muted-foreground flex items-center gap-3">
            <span className="w-6 h-px bg-brass"></span>
            Control room
          </p>
          <h1 className="font-display italic text-4xl lg:text-5xl mt-3 tracking-tight">
            Admin<span className="text-brass">.</span>
          </h1>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-8 lg:gap-12 items-start">
          {/* Sidebar — desktop only */}
          <aside className="hidden lg:flex sticky top-12 flex-col gap-8">
            {user && (
              <div className="rounded-2xl border border-border bg-card shadow-sm p-4 flex items-center gap-3">
                <div className="size-10 shrink-0 rounded-full bg-coal text-bone grid place-items-center font-display font-bold">
                  {user.name?.[0]?.toUpperCase() ?? "A"}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {user.title || (user.role === "admin" ? "Administrator" : user.role)}
                  </p>
                </div>
              </div>
            )}
            <nav className="flex flex-col gap-1.5">
              {nav.map(({ to, label, icon: Icon }) => {
                const active = to === "/admin/" ? path === "/admin/" || path === "/admin" : path.startsWith(to);
                return (
                  <Link
                    key={to}
                    to={to as never}
                    className={`group flex items-center gap-3 px-4 h-10 text-sm font-medium transition-all ${
                      active
                        ? "border-l-2 border-brass text-brass"
                        : "border-l-2 border-transparent text-muted-foreground hover:text-foreground hover:border-coal/10"
                    }`}
                  >
                    <Icon
                      className={`size-4 transition-colors ${active ? "text-brass" : "text-muted-foreground group-hover:text-foreground"}`}
                      strokeWidth={active ? 2.5 : 1.5}
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
