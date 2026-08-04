import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Kifayat" }] }),
  beforeLoad: () => redirect({ to: "/auth", search: { mode: "signup" } }),
  component: Register,
});

function Register() {
  useEffect(() => {
    redirect({ to: "/auth", search: { mode: "signup" } });
  }, []);
  return null;
}
