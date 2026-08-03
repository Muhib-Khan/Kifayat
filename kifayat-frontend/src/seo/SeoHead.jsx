import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";
import SEO_CONFIG from "./config";

const { siteUrl, siteName, defaultImage, twitterHandle, locale, themeColor } =
  SEO_CONFIG;

export default function SeoHead({
  title,
  description,
  canonical,
  image,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  noindex = false,
  nofollow = false,
  jsonld,
  children,
}) {
  const pageTitle = title
    ? `${title} | ${siteName}`
    : siteName;
  const pageDesc =
    description || SEO_CONFIG.siteDescription;
  const pageImage = image
    ? image.startsWith("http")
      ? image
      : `${siteUrl}${image}`
    : `${siteUrl}${defaultImage}`;
  const pageUrl = url || (canonical ? `${siteUrl}${canonical}` : siteUrl);

  const robots = [
    noindex ? "noindex" : "index",
    nofollow ? "nofollow" : "follow",
    "max-snippet:-1",
    "max-image-preview:large",
    "max-video-preview:-1",
  ].join(", ");

  const jsonldScripts = Array.isArray(jsonld) ? jsonld : jsonld ? [jsonld] : [];

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <meta name="robots" content={robots} />

      {/* Canonical */}
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={pageImage} />

      {/* Apple / Mobile */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <meta name="theme-color" content={themeColor} />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="application-name" content={siteName} />
      <meta name="format-detection" content="telephone=no" />

      {/* JSON-LD */}
      {jsonldScripts.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}

      {children}
    </Helmet>
  );
}

SeoHead.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  canonical: PropTypes.string,
  image: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.string,
  publishedTime: PropTypes.string,
  modifiedTime: PropTypes.string,
  noindex: PropTypes.bool,
  nofollow: PropTypes.bool,
  jsonld: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
  ]),
  children: PropTypes.node,
};
