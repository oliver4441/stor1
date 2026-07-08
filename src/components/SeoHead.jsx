import { Helmet } from 'react-helmet-async'
import seoConfig from '../utils/seo.js'

/**
 * Reusable SEO component using react-helmet-async.
 * Renders standard meta tags, Open Graph, Twitter Card, canonical link, and JSON-LD.
 */
export default function SeoHead({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  jsonLd = [],
}) {
  const { defaultTitle, defaultDescription, siteUrl, siteName, defaultOgImage, twitterHandle, locale } = seoConfig

  const resolvedTitle = title ? `${title} | ${siteName}` : defaultTitle
  const resolvedDescription = description || defaultDescription
  const resolvedOgImage = ogImage || defaultOgImage
  const resolvedCanonical = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : siteUrl)

  return (
    <Helmet>
      {/* Standard meta tags */}
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <html lang="en" />

      {/* Canonical URL */}
      <link rel="canonical" href={resolvedCanonical} />

      {/* Open Graph */}
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:image" content={`${siteUrl}${resolvedOgImage}`} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={`${siteUrl}${resolvedOgImage}`} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}

      {/* Geo / location hints */}
      <meta name="geo.region" content="KE" />
      <meta name="geo.placename" content="Kericho" />

      {/* JSON-LD Structured Data */}
      {jsonLd.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  )
}
