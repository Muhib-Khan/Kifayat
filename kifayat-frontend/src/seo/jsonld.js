import SEO_CONFIG from "./config";

const { siteUrl, siteName, organization } = SEO_CONFIG;

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: organization.name,
    legalName: organization.legalName,
    url: organization.url,
    logo: `${siteUrl}${organization.logo}`,
    description: organization.description,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: organization.contactPhone,
      email: organization.contactEmail,
      contactType: "customer service",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: organization.address.streetAddress,
      addressLocality: organization.address.addressLocality,
      addressRegion: organization.address.addressRegion,
      postalCode: organization.address.postalCode,
      addressCountry: organization.address.addressCountry,
    },
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/dashboard?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items) {
  if (!items || items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url ? `${item.url.startsWith("http") ? "" : siteUrl}${item.url}` : undefined,
    })),
  };
}

export function productSchema(product) {
  if (!product) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name} available at Kifayat`,
    sku: product.sku || product._id,
    mpn: product._id,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    category: product.category || undefined,
    image: product.imageUrl ? product.imageUrl.split(",")[0].trim() : undefined,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/product/${product.slug || product._id}`,
      priceCurrency: "PKR",
      price: product.retailPrice || 0,
      priceValidUntil: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0],
      availability:
        (product.inStock ?? product.stock > 0)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      ...((product.inStock ?? product.stock > 0) && {
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "PK",
          returnPolicyCategory: "https://schema.org/MerchantReturnUnspecified",
          merchantReturnDays: 7,
        },
      }),
    },
    ...(product.reviews &&
      product.reviews.length > 0 && {
        review: product.reviews.map((r) => ({
          "@type": "Review",
          reviewRating: {
            "@type": "Rating",
            ratingValue: r.rating,
            bestRating: "5",
          },
          author: {
            "@type": "Person",
            name: r.userName || "Verified Customer",
          },
        })),
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.avgRating || 0,
          reviewCount: product.reviewCount || product.reviews.length,
          bestRating: "5",
          worstRating: "1",
        },
      }),
  };
}

export function searchActionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/dashboard?search={search_term}`,
      },
      "query-input": "required name=search_term",
    },
  };
}
