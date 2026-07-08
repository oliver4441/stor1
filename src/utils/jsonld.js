import seoConfig from './seo.js'

const { siteUrl } = seoConfig

/**
 * Returns Organization schema for Omix Systems.
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Omix Store',
    url: siteUrl,
    logo: `${siteUrl}/logo.jpg`,
    sameAs: [],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Kericho',
      addressCountry: 'KE',
    },
  }
}

/**
 * Returns WebSite schema with site-level search action.
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Omix Store',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Maps internal condition values to schema.org condition values.
 */
function mapCondition(condition) {
  switch (condition) {
    case 'new':
      return 'NewCondition'
    case 'used':
      return 'UsedCondition'
    case 'refurbished':
      return 'RefurbishedCondition'
    default:
      return 'NewCondition'
  }
}

/**
 * Maps quantity to schema.org availability.
 */
function mapAvailability(quantity) {
  return quantity > 0 ? 'InStock' : 'OutOfStock'
}

/**
 * Returns full Product schema from a product object.
 *
 * @param {object} product
 * @param {string|number}  product.id
 * @param {string}         product.title
 * @param {string}         [product.description]
 * @param {number}         [product.price]
 * @param {string[]}       [product.images]
 * @param {string}         [product.brand]
 * @param {number}         [product.avg_rating]
 * @param {number}         [product.review_count]
 * @param {string}         [product.category]
 * @param {number}         [product.quantity]
 * @param {string}         [product.availability]
 * @param {string}         [product.condition]
 */
export function getProductSchema(product = {}) {
  const {
    id,
    title,
    description,
    price,
    images = [],
    brand,
    avg_rating,
    review_count,
    category,
    quantity = 0,
    availability,
    condition,
  } = product

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${siteUrl}/products/${id}`,
    name: title,
    description: description || '',
    url: `${siteUrl}/products/${id}`,
    image: images.length > 0 ? images.map(img => `${siteUrl}${img.startsWith('/') ? img : `/${img}`}`) : undefined,
    category: category || undefined,
  }

  // Brand
  if (brand) {
    schema.brand = {
      '@type': 'Brand',
      name: brand,
    }
  }

  // Aggregate rating
  if (typeof avg_rating === 'number' && typeof review_count === 'number' && review_count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avg_rating,
      reviewCount: review_count,
    }
  }

  // Offers
  if (typeof price === 'number') {
    schema.offers = {
      '@type': 'Offer',
      priceCurrency: 'KES',
      price,
      url: `${siteUrl}/products/${id}`,
      availability: `https://schema.org/${availability || mapAvailability(quantity)}`,
      itemCondition: `https://schema.org/${mapCondition(condition)}`,
    }
  }

  return schema
}

/**
 * Returns BreadcrumbList schema from an array of {name, url} items.
 *
 * @param {Array<{name: string, url: string}>} items
 */
export function getBreadcrumbSchema(items = []) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  }
}

/**
 * Convenience wrapper that returns an array of JSON-LD objects
 * suitable for a Product Detail Page (PDP).
 * Includes Organization + Product + BreadcrumbList schemas.
 *
 * @param {object} product — see getProductSchema for shape
 */
export function getProductJsonLd(product) {
  const items = [getOrganizationSchema(), getProductSchema(product)]

  if (product && product.title) {
    const breadcrumb = getBreadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: product.category || 'Products', url: `/category/${product.category || 'all'}` },
      { name: product.title, url: `/products/${product.id}` },
    ])
    items.push(breadcrumb)
  }

  return items
}
