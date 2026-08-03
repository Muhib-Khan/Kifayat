import { useEffect, useRef, useState, type ReactNode } from "react";
import { LenisContext } from "./LenisContext";

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<import("lenis").default | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let cleanup = () => {};
    let cancelled = false;
    let raf = 0;

    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const instance = new Lenis({
        lerp: 0.095,
        smoothWheel: true,
        wheelMultiplier: 0.88,
        touchMultiplier: 1.1,
        syncTouch: false,
      });
      setLenis(instance);
      const loop = (time: number) => {
        instance.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      cleanup = () => {
        cancelAnimationFrame(raf);
        instance.destroy();
        setLenis(null);
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <LenisContext.Provider value={{ lenis }}>
      {children}
    </LenisContext.Provider>
  );
}
