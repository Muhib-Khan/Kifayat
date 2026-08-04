import { Link, useRouterState } from "@tanstack/react-router";
import { House, LayoutGrid, ShoppingBag, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: House },
  { to: "/products", label: "Shop", icon: LayoutGrid },
  { to: "/cart", label: "Bag", icon: ShoppingBag },
  { to: "/account", label: "Account", icon: User },
] as const;

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-coal text-bone border-t border-bone/10 h-16 grid grid-cols-4">
      {items.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        return (
          <Link key={to} to={to} className="flex flex-col items-center justify-center gap-1.5 group">
            <Icon
              strokeWidth={1.4}
              className={`size-5 transition ${active ? "text-brass" : "text-bone/55 group-hover:text-bone"}`}
            />
            <span className={`text-[9px] tracking-[0.22em] uppercase font-mono transition ${active ? "text-brass" : "text-bone/50 group-hover:text-bone"}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
