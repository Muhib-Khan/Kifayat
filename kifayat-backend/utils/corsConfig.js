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
  return getAllowedOrigins().includes(origin);
};

module.exports = { getAllowedOrigins, isOriginAllowed };
