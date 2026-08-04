// Explicit CORS origin allowlist. Do not add wildcard domains here —
// production origins belong in the CORS_ORIGINS env var (comma-separated).
const getAllowedOrigins = () => {
  const origins = new Set([
    process.env.FRONTEND_URL || "http://localhost:5000",
    "http://localhost:5000",
    "http://localhost:5173",
    "http://localhost:5174",
  ]);
  (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
    .forEach((o) => origins.add(o));
  return [...origins];
};

const isOriginAllowed = (origin) => {
  if (!origin) return true; // non-browser clients (curl, health checks)
  if (getAllowedOrigins().includes(origin)) return true;
  // Kifayat's live domains (apex + www). Exact matches only — no wildcards.
  return origin === "https://kifayat.co" || origin === "https://www.kifayat.co";
};

module.exports = { getAllowedOrigins, isOriginAllowed };
