import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/landing/PageShell";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Kifayat" }] }),
  component: Register,
});

function Register() {
  return (
    <PageShell>
      <div className="max-w-md mx-auto px-4 py-14">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="size-10 rounded-md bg-gradient-to-br from-primary to-accent grid place-items-center text-primary-foreground font-display font-bold">K</div>
            <span className="font-display font-bold text-2xl">Kifayat</span>
          </Link>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-[var(--shadow-e1)]">
          <h1 className="text-2xl mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground mb-6">Save addresses, track orders, earn rewards.</p>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <label className="block"><span className="block text-sm font-medium mb-1.5">Full name</span>
              <input required placeholder="Ali Khan" className="w-full h-11 px-3.5 rounded-md border border-border outline-none focus:border-primary text-sm" />
            </label>
            <label className="block"><span className="block text-sm font-medium mb-1.5">Email</span>
              <input type="email" required placeholder="you@example.com" className="w-full h-11 px-3.5 rounded-md border border-border outline-none focus:border-primary text-sm" />
            </label>
            <label className="block"><span className="block text-sm font-medium mb-1.5">Phone</span>
              <input required placeholder="+92 300 1234567" className="w-full h-11 px-3.5 rounded-md border border-border outline-none focus:border-primary text-sm" />
            </label>
            <label className="block"><span className="block text-sm font-medium mb-1.5">Password</span>
              <input type="password" required placeholder="At least 8 characters" className="w-full h-11 px-3.5 rounded-md border border-border outline-none focus:border-primary text-sm" />
            </label>
            <label className="flex items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" className="size-4 mt-0.5 accent-[color:var(--color-primary)]" /> I agree to the <Link to="/terms" className="text-primary hover:underline">Terms</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</label>
            <button className="w-full h-12 rounded-pill bg-primary text-primary-foreground font-semibold hover:bg-primary-dark transition">Create account</button>
          </form>
          <p className="text-sm text-center text-muted-foreground mt-6">Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></p>
        </div>
      </div>
    </PageShell>
  );
}
