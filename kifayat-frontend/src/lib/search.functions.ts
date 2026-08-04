/**
 * Search functions backed by the Kifayat Express API.
 */
import { api, normalizeProduct, type UIProduct } from "./api";

export async function searchProducts(opts: {
  q: string;
  sort?: "relevance" | "newest" | "price_asc" | "price_desc" | "rating";
  brand?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  min_rating?: number | null;
  page?: number;
}): Promise<{
  items: UIProduct[];
  facets: { brands: string[]; min_price: number; max_price: number } | null;
  total_pages: number;
  total: number;
}> {
  if (!opts.q?.trim()) {
    return { items: [], facets: null, total_pages: 1, total: 0 };
  }

  const sortMap: Record<string, string> = {
    relevance: "",
    newest: "",
    price_asc: "price_asc",
    price_desc: "price_desc",
    rating: "trending",
  };

  const params = new URLSearchParams();
  params.set("search", opts.q);
  if (opts.sort && sortMap[opts.sort]) params.set("sort", sortMap[opts.sort]);
  if (opts.page) params.set("page", String(opts.page));
  params.set("limit", "30");

  const data = await api.get<{
    success: boolean;
    products: any[];
    total: number;
    pages: number;
  }>(`/products?${params}`);

  let items = (data.products ?? []).map(normalizeProduct);

  // Client-side filtering for features not in backend
  if (opts.min_price != null) items = items.filter((p) => p.price >= opts.min_price!);
  if (opts.max_price != null) items = items.filter((p) => p.price <= opts.max_price!);
  if (opts.brand) {
    const b = opts.brand.toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(b));
  }

  const prices = items.map((p) => p.price);
  return {
    items,
    facets:
      items.length > 0
        ? {
            brands: [],
            min_price: Math.min(...prices),
            max_price: Math.max(...prices),
          }
        : null,
    total_pages: data.pages ?? 1,
    total: data.total ?? items.length,
  };
}

export async function trendingSearches(): Promise<string[]> {
  return [];
}

export async function searchSuggest(
  q: string,
): Promise<{ queries: string[]; products: any[] }> {
  if (!q.trim()) return { queries: [], products: [] };
  try {
    const data = await api.get<{ success: boolean; products: any[] }>(
      `/products?search=${encodeURIComponent(q)}&limit=5`,
    );
    const products = (data.products ?? []).map(normalizeProduct);
    return { queries: [], products };
  } catch {
    return { queries: [], products: [] };
  }
}
