import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const reduceMotion = useReducedMotion();
  const isAdmin = pathname.startsWith("/admin");

  if (reduceMotion) return <>{children}</>;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        key={pathname}
        initial={{ opacity: 0, y: isAdmin ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
      >
        {children}
      </m.div>

      {!isAdmin && (
        <>
          <m.div
            key={pathname + "-curtain-top"}
            className="fixed inset-x-0 top-0 z-[100] bg-coal pointer-events-none origin-top will-change-transform"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 1.35, ease: [0.76, 0, 0.24, 1] }}
            style={{ height: "55vh" }}
          />
          <m.div
            key={pathname + "-curtain-bot"}
            className="fixed inset-x-0 bottom-0 z-[100] bg-coal pointer-events-none origin-bottom will-change-transform"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 1.35, ease: [0.76, 0, 0.24, 1], delay: 0.08 }}
            style={{ height: "55vh" }}
          />
          <m.div
            key={pathname + "-curtain-mark"}
            className="fixed inset-0 z-[101] grid place-items-center pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.05, ease: "easeOut", delay: 0.24 }}
          >
            <m.span
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="font-display italic text-bone text-5xl lg:text-7xl tracking-tight"
            >
              Kifayat<span className="text-brass">.</span>
            </m.span>
          </m.div>
        </>
      )}
    </LazyMotion>
  );
}
