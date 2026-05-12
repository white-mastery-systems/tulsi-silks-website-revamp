/**
 * Homepage JSON-LD (`<script type="application/ld+json" id="home-jsonld">`).
 * Replace/update this graph when the SEO team supplies the final approved schema.
 * `index.html` has no static schema; injection is via `CommonService.createJsonLD`.
 */
export function buildHomePageJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://tulsisilks.co.in/#organization',
        name: 'Tulsi Silks',
        url: 'https://tulsisilks.co.in/',
        logo: 'https://yourstore.io/api/uploads/5d30013a5c83a702392c4c8b/logo.png',
        sameAs: [
          'https://www.instagram.com/tulsisilks/',
          'https://x.com/TulsiSilks',
          'https://www.facebook.com/tulsisilks',
        ],
        foundingDate: '1993',
        founders: [
          { '@type': 'Person', name: 'Suresh Parekh' },
          { '@type': 'Person', name: 'Santosh Parekh' },
        ],
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            telephone: '+91-9791019822',
            email: 'orders@tulsisilks.com',
            areaServed: 'IN',
            availableLanguage: ['en', 'ta', 'hi', 'te', 'mwr'],
          },
        ],
      },
      {
        '@type': 'Store',
        '@id': 'https://tulsisilks.co.in/#store',
        name: 'Tulsi Silks Saree Store',
        url: 'https://tulsisilks.co.in/',
        image: 'https://yourstore.io/api/uploads/5d30013a5c83a702392c4c8b/logo.png',
        telephone: '+91-9791019822',
        email: 'orders@tulsisilks.com',
        parentOrganization: { '@id': 'https://tulsisilks.co.in/#organization' },
        additionalType: 'https://www.wikidata.org/wiki/Q1153805',
        priceRange: '₹₹₹',
        currenciesAccepted: 'INR',
        paymentAccepted: 'UPI, Credit Card, Debit Card, NetBanking, Cash',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '68, Luz Church Rd',
          addressLocality: 'Mylapore',
          addressRegion: 'Tamil Nadu',
          postalCode: '600004',
          addressCountry: 'IN',
        },
        geo: { '@type': 'GeoCoordinates', latitude: 13.037367, longitude: 80.262608 },
        hasMap: 'https://maps.google.com/?q=13.037367,80.262608',
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            opens: '09:30',
            closes: '19:30',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: 'Sunday',
            opens: '10:00',
            closes: '19:00',
          },
        ],
        sameAs: [
          'https://www.instagram.com/tulsisilks/',
          'https://x.com/TulsiSilks',
          'https://www.facebook.com/tulsisilks',
        ],
      },
      {
        '@type': 'MerchantReturnPolicy',
        '@id': 'https://tulsisilks.co.in/#return-policy',
        name: 'Tulsi Silks Return Policy',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
        applicableCountry: 'IN',
      },
      {
        '@type': 'WebSite',
        '@id': 'https://tulsisilks.co.in/#website',
        url: 'https://tulsisilks.co.in/',
        name: 'Tulsi Silks',
        publisher: { '@id': 'https://tulsisilks.co.in/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://tulsisilks.co.in/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}
