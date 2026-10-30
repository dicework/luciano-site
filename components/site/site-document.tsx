import { getTranslator, localePath, type Locale } from '@/i18n';
import { shareImage } from '@/i18n/metadata';
import { LanguageProvider } from '@/components/i18n/language-provider';
import type { Metadata } from 'next';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { CartProvider } from '@/components/cart/cart-provider';
import { MessagingTestProvider } from '@/components/messaging-test-provider';
import { restaurant } from '@/content/restaurant';
import '@fontsource/cormorant-garamond/cyrillic-500.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/cyrillic-500-italic.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/manrope/cyrillic-400.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/cyrillic-600.css';
import '@fontsource/manrope/latin-600.css';
import '@/app/globals.css';

export function siteMetadata(locale: Locale): Metadata {
  const t = getTranslator(locale);
  return {
    metadataBase: new URL(restaurant.siteUrl),
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48' },
        { url: '/icon.png', type: 'image/png', sizes: '192x192' },
      ],
      apple: '/apple-icon.png',
    },
    openGraph: {
      type: 'website',
      locale: locale === 'bg' ? 'bg_BG' : 'en_GB',
      siteName: t('Лучиано'),
      title: t('Пицария Лучиано: пица на пещ и обедно меню във Варна'),
      description: t('Пица на пещ, прясна паста и хубава компания на ул. „Русе“ 13, Варна.'),
      images: [shareImage(locale)],
    },
    twitter: { card: 'summary' },
    title: {
      default: t('Пицария Лучиано: пица на пещ и обедно меню във Варна'),
      template: t('%s | Лучиано · Варна'),
    },
    description: t(
      'Неаполитанска пица, паста и седмично обедно меню на ул. „Русе“ 13, до Операта. Поръчайте онлайн с доставка или запазете маса. Всеки ден от 08:00.',
    ),
  };
}
export default function SiteDocument({ children, locale }: Readonly<{ children: React.ReactNode; locale: Locale }>) {
  const t = getTranslator(locale);
  const name = t(restaurant.name);
  const business = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': restaurant.siteUrl + '/#restaurant',
    name,
    alternateName: restaurant.alternateNames.filter((alternate) => alternate !== name),
    url: restaurant.siteUrl,
    logo: restaurant.siteUrl + restaurant.logo,
    image: [restaurant.siteUrl + '/images/interior.webp', restaurant.siteUrl + '/images/pizza.webp'],
    telephone: restaurant.phone,
    priceRange: '€',
    address: {
      '@type': 'PostalAddress',
      streetAddress: t(restaurant.address),
      addressLocality: t(restaurant.city),
      postalCode: restaurant.postalCode,
      addressCountry: 'BG',
    },
    geo: { '@type': 'GeoCoordinates', ...restaurant.geo },
    servesCuisine: ['Italian', 'Pizza'],
    hasMenu: restaurant.siteUrl + localePath('/menu/', locale),
    acceptsReservations: restaurant.siteUrl + localePath('/reservations/', locale),
    sameAs: [restaurant.instagram, restaurant.mapListingUrl],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '08:00',
        closes: '22:00',
      },
    ],
  };
  return (
    <html lang={locale}>
      <body>
        <a className="skip-link" href="#main">
          {t('Към съдържанието')}
        </a>
        <LanguageProvider locale={locale}>
          <MessagingTestProvider>
            <CartProvider>
              <Header />
              {children}
              <Footer locale={locale} />
            </CartProvider>
          </MessagingTestProvider>
        </LanguageProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(business).replace(/</g, '\\u003c'),
          }}
        />
      </body>
    </html>
  );
}
