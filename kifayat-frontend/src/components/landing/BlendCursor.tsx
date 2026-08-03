import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function BlendCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [touchPoint, setTouchPoint] = useState<{ x: number; y: number; id: number } | null>(null);
  const target = useRef({ x: -100, y: -100 });
  const current = useRef({ x: -100, y: -100 });
  const pressedRef = useRef(false);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (hasFinePointer) {
      document.body.classList.add("has-blend-cursor");
      setActive(true);
    }

    const move = (e: MouseEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      const el = e.target as HTMLElement | null;
      const labelled = el?.closest<HTMLElement>("[data-cursor]");
      const next = labelled?.dataset.cursor ?? null;
      setLabel((prev) => (prev === next ? prev : next === "view" ? "View" : next));
    };

    const touch = (e: PointerEvent) => {
      setTouchPoint({ x: e.clientX, y: e.clientY, id: Date.now() });
      pressedRef.current = true;
      setPressed(true);
    };

    const release = () => {
      pressedRef.current = false;
      setPressed(false);
    };

    const loop = () => {
      current.current.x += (target.current.x - current.current.x) * 0.22;
      current.current.y += (target.current.y - current.current.y) * 0.22;
      if (dot.current) dot.current.style.transform = `translate3d(${target.current.x}px, ${target.current.y}px, 0)`;
      if (ring.current) {
        const scale = pressedRef.current ? 0.66 : 1;
        ring.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) scale(${scale})`;
      }
      raf.current = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("pointerdown", touch, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    window.addEventListener("blur", release);
    raf.current = requestAnimationFrame(loop);
    return () => {
      document.body.classList.remove("has-blend-cursor");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  if (!active && !touchPoint) return null;

  return (
    <>
      {active && (
        <>
          <div
            ref={dot}
            aria-hidden
            style={{ mixBlendMode: "difference" }}
            className="fixed top-0 left-0 z-[200] pointer-events-none -ml-[3px] -mt-[3px] size-[6px] rounded-full bg-bone"
          />
          <div
            ref={ring}
            aria-hidden
            style={{ mixBlendMode: "difference" }}
            className={`fixed top-0 left-0 z-[200] pointer-events-none flex items-center justify-center rounded-full border border-bone/70 transition-[width,height,background,color,transform] duration-300 ease-out ${
              label ? "-ml-[44px] -mt-[44px] size-[88px] bg-brass border-brass text-coal" : "-ml-[18px] -mt-[18px] size-9 bg-transparent text-bone"
            }`}
          >
            {label && <span className="eyebrow text-coal">{label}</span>}
          </div>
        </>
      )}
      <AnimatePresence>
        {touchPoint && (
          <motion.div
            key={touchPoint.id}
            aria-hidden
            initial={{ opacity: 0.85, scale: 0.25 }}
            animate={{ opacity: 0, scale: 1.8 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            onAnimationComplete={() => setTouchPoint(null)}
            style={{ left: touchPoint.x, top: touchPoint.y }}
            className="fixed z-[201] pointer-events-none -ml-5 -mt-5 size-10 rounded-full border-2 border-brass"
          >
            <span className="absolute inset-2 rounded-full bg-brass/40" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
