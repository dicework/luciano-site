import { getTranslator, localePath, type Locale } from '@/i18n';
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
    icons: { icon: '/icon.svg' },
    openGraph: {
      type: 'website',
      locale: locale === 'bg' ? 'bg_BG' : 'en_GB',
      siteName: t('Лучиано'),
      title: t('Лучиано – неаполитанска пица във Варна'),
      description: t('Пица на пещ, прясна паста и хубава компания на ул. „Русе“ 13, Варна.'),
    },
    title: {
      default: t('Лучиано – неаполитанска пица във Варна'),
      template: t('%s | Лучиано · Варна'),
    },
    description: t(
      'Италианска кухня, пица на пещ и прясна паста в центъра на Варна. Очакваме ви всеки ден, 08:00–22:00, на ул. „Русе“ 13.',
    ),
  };
}
export default function SiteDocument({ children, locale }: Readonly<{ children: React.ReactNode; locale: Locale }>) {
  const t = getTranslator(locale);
  const business = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: t(restaurant.name),
    url: restaurant.siteUrl,
    telephone: restaurant.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: t(restaurant.address),
      addressLocality: t(restaurant.city),
      addressCountry: 'BG',
    },
    servesCuisine: ['Italian', 'Pizza'],
    hasMenu: restaurant.siteUrl + localePath('/menu/', locale),
    sameAs: [restaurant.instagram],
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
