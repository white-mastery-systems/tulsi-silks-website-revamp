/**
 * Homepage JSON-LD (`<script type="application/ld+json" id="home-jsonld">`).
 * `index.html` has no static schema; injection via `CommonService.createJsonLD`.
 * Domain, phone, address, logo, and social URLs are supplied by `CommonService.buildHomeJsonLdInput()`.
 */

export interface HomeJsonLdInput {
  origin: string;
  organizationName: string;
  storeName: string;
  logoUrl: string;
  telephone: string;
  email: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode: string;
  addressCountry: string;
  latitude: number;
  longitude: number;
  sameAs: string[];
}

export function buildHomePageJsonLd(input: HomeJsonLdInput): Record<string, unknown> {
  const base = input.origin.replace(/\/$/, '');
  const orgId = `${base}/#organization`;
  const storeId = `${base}/#store`;
  const websiteId = `${base}/#website`;
  const lat = input.latitude;
  const lng = input.longitude;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: input.organizationName,
        url: `${base}/`,
        logo: input.logoUrl,
        sameAs: input.sameAs,
        foundingDate: '1993',
        founders: [
          { '@type': 'Person', name: 'Suresh Parekh' },
          { '@type': 'Person', name: 'Santosh Parekh' },
        ],
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            telephone: input.telephone,
            email: input.email,
            areaServed: 'IN',
            availableLanguage: ['en', 'ta', 'hi', 'te', 'mwr'],
          },
        ],
      },
      {
        '@type': 'Store',
        '@id': storeId,
        name: input.storeName,
        url: `${base}/`,
        image: input.logoUrl,
        telephone: input.telephone,
        email: input.email,
        parentOrganization: { '@id': orgId },
        additionalType: 'https://www.wikidata.org/wiki/Q1153805',
        priceRange: '₹₹₹',
        currenciesAccepted: 'INR',
        paymentAccepted: 'UPI, Credit Card, Debit Card, NetBanking, Cash',
        address: {
          '@type': 'PostalAddress',
          streetAddress: input.streetAddress,
          addressLocality: input.addressLocality,
          addressRegion: input.addressRegion,
          postalCode: input.postalCode,
          addressCountry: input.addressCountry,
        },
        geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng },
        hasMap: `https://maps.google.com/?q=${lat},${lng}`,
        /** Mon–Sat 9:30–19:30 (closed Sunday) */
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '09:30',
            closes: '19:30',
          },
        ],
        sameAs: input.sameAs,
      },
      {
        '@type': 'MerchantReturnPolicy',
        '@id': `${base}/#return-policy`,
        name: `${input.organizationName} Return Policy`,
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
        applicableCountry: input.addressCountry || 'IN',
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: `${base}/`,
        name: input.organizationName,
        publisher: { '@id': orgId },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${base}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}
