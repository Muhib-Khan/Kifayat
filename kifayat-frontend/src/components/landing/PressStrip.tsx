const press = ["DAWN", "Vogue India", "Wired", "Monocle", "GQ Pakistan", "Forbes", "Dezeen"];

export function PressStrip() {
  return (
    <section className="bg-paper py-12 lg:py-16 border-y border-coal/8 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-5 lg:px-10 mb-8 lg:mb-10">
        <p className="eyebrow text-coal/40 text-center">As mentioned in</p>
      </div>
      <div className="flex overflow-hidden">
        <div className="flex gap-16 lg:gap-24 whitespace-nowrap animate-marquee shrink-0 pr-16 lg:pr-24">
          {[...press, ...press, ...press].map((p, i) => (
            <span key={i} className="font-display italic text-4xl lg:text-5xl text-coal/50">{p}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
