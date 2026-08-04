import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/landing/PageShell";
import { Heart, Sparkles, Truck, Users } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { OrganizationSchema } from "@/components/seo/JsonLd";

export const Route = createFileRoute("/about")({
  component: About,
});

const values = [
  { Icon: Heart, title: "Built for Karachi", text: "From DHA to Gulshan, we know what local shoppers need and how fast they need it." },
  { Icon: Sparkles, title: "Curated, not cluttered", text: "We hand-pick every product so you don't waste hours scrolling through duplicates." },
  { Icon: Truck, title: "Reliable delivery", text: "Most orders arrive within 2–4 days, with COD and easy returns across the city." },
  { Icon: Users, title: "Local team", text: "A small Karachi team answers your messages — no scripts, no run-arounds." },
];

function About() {
  return (
    <PageShell>
      <SEO
        title="About Kifayat — Honest Online Shopping in Karachi"
        description="Kifayat is built for everyday Karachi shoppers — curated products, honest prices and reliable delivery from a local team that replies within an hour."
        path="/about"
        keywords="about Kifayat, Karachi online store, honest online shopping Pakistan, local e-commerce Karachi"
      />
      <OrganizationSchema />

      <PageHeader
        title="About Kifayat"
        subtitle="A modern Karachi storefront built on honest prices and reliable service."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "About" }]}
      />
      <section className="max-w-4xl mx-auto px-4 py-14 prose-like">
        <p className="text-lg text-muted-foreground leading-relaxed">
          Kifayat began with a simple frustration: shopping online in Karachi often meant paying more for less, dealing with fakes, or waiting weeks for delivery. We thought it could be better — so we built it.
        </p>
        <p className="text-lg text-muted-foreground leading-relaxed mt-5">
          Today, Kifayat offers a curated selection of electronics, fashion, home goods and more — sourced from verified suppliers, priced fairly, and delivered fast across the city.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 mt-12">
          {values.map(({ Icon, title, text }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-6">
              <Icon className="size-6 text-brass mb-3" strokeWidth={1.5} />
              <h3 className="font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

export default About;
