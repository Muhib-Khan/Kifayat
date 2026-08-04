import { useRef, type PointerEvent } from "react";

export function ZoomImage({
  src,
  alt,
  className = "",
  onClick,
}: {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const frame = useRef<number | null>(null);

  const updateOrigin = (e: PointerEvent<HTMLDivElement>) => {
    if (frame.current) return;
    // Capture currentTarget and pointer coords synchronously before the rAF —
    // React nulls out currentTarget once the event handler returns.
    const target = e.currentTarget;
    const clientX = e.clientX;
    const clientY = e.clientY;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const img = imgRef.current;
      if (!img || !target) return;
      const r = target.getBoundingClientRect();
      const x = ((clientX - r.left) / r.width) * 100;
      const y = ((clientY - r.top) / r.height) * 100;
      img.style.transformOrigin = `${x}% ${y}%`;
    });
  };

  return (
    <div
      className={`relative overflow-hidden cursor-zoom-in ${className}`}
      onPointerMove={updateOrigin}
      onClick={onClick}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="size-full object-contain transition-transform duration-500 ease-out [@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.45] motion-reduce:transition-none motion-reduce:hover:scale-100"
      />
    </div>
  );
}