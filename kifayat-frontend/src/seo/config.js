const SEO_CONFIG = {
  siteName: "Kifayat",
  siteUrl: import.meta.env.VITE_SITE_URL || "https://kifayat.com",
  siteDescription:
    "Kifayat — Your trusted online store for quality products at wholesale and retail prices. Shop electronics, fashion, home goods and more.",
  siteTitle: "Kifayat — Shop Quality Products Online",
  defaultImage: "/hero.png",
  twitterHandle: "@kifayat",
  locale: "en_PK",
  themeColor: "#6366f1",
  organization: {
    name: "Kifayat",
    legalName: "Kifayat Stores",
    url: import.meta.env.VITE_SITE_URL || "https://kifayat.com",
    logo: "/favicon.svg",
    description:
      "Kifayat is a wholesale and retail e-commerce platform offering quality products across multiple categories.",
    contactEmail: import.meta.env.VITE_CONTACT_EMAIL || "contact@kifayat.co",
    contactPhone: import.meta.env.VITE_CONTACT_PHONE || "",
  },
};

export default SEO_CONFIG;
