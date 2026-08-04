import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { PageShell } from "@/components/landing/PageShell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    try {
      const data = await api.get<{ success: boolean; user: any }>("/auth/me");
      if (!data?.user) throw redirect({ to: "/auth" });
      return { user: data.user };
    } catch (err: any) {
      if (isRedirect(err)) throw err;
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <PageShell>
      <Outlet />
    </PageShell>
  );
}
