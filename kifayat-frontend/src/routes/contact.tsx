import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/landing/PageShell";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { SEO } from "@/components/seo/SEO";
import { LocalBusinessSchema } from "@/components/seo/JsonLd";

export const Route = createFileRoute("/contact")({
  component: Contact,
});

function Contact() {
  return (
    <PageShell>
      <SEO
        title="Contact Us — We Reply Within an Hour"
        description="Get in touch with the Kifayat team in Karachi. We reply within an hour during business hours. Reach us by email, phone, or WhatsApp."
        path="/contact"
        keywords="contact Kifayat, Karachi online store support, customer service Pakistan, WhatsApp shopping help"
      />
      <LocalBusinessSchema />

      <PageHeader
        title="Get in touch"
        subtitle="We usually reply within an hour during business hours."
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Contact" }]}
      />

      <section className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-[1fr_360px] gap-10">
        <form className="bg-card border border-border rounded-2xl p-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="grid sm:grid-cols-2 gap-4">
            <label>
              <span className="block text-sm font-medium mb-1.5">Name</span>
              <input required className="w-full h-11 px-3.5 rounded-md border border-border outline-none focus:border-primary text-sm" />
            </label>
            <label>
              <span className="block text-sm font-medium mb-1.5">Email</span>
              <input type="email" required className="w-full h-11 px-3.5 rounded-md border border-border outline-none focus:border-primary text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Subject</span>
            <input className="w-full h-11 px-3.5 rounded-md border border-border outline-none focus:border-primary text-sm" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Message</span>
            <textarea rows={5} required className="w-full px-3.5 py-2.5 rounded-md border border-border outline-none focus:border-primary text-sm resize-none" />
          </label>
          <button type="submit" className="w-full h-11 bg-foreground text-background rounded-md text-sm font-semibold hover:opacity-90 transition">
            Send message
          </button>
        </form>

        <div className="space-y-6">
          {[
            { Icon: Mail, label: "Email", value: "hello@kifayat.com" },
            { Icon: Phone, label: "Phone / WhatsApp", value: "+92 300 0000000" },
            { Icon: MapPin, label: "Location", value: "Karachi, Pakistan" },
            { Icon: MessageCircle, label: "Hours", value: "Mon–Sat, 9 am–9 pm" },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4 bg-card border border-border rounded-xl p-4">
              <div className="size-9 bg-secondary rounded-lg grid place-items-center shrink-0">
                <Icon className="size-4 text-brass" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5 font-medium">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
