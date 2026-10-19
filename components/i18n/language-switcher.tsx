'use client';
import { usePathname } from 'next/navigation';
import { useI18n } from './language-provider';
import { localePath, locales } from '@/i18n';
export function LanguageSwitcher() {
  const path = usePathname();
  const { locale, t } = useI18n();
  return (
    <fieldset className="language-switcher">
      <legend className="sr-only">{t('Език')}</legend>
      {locales.map((language) => (
        <a
          key={language}
          href={localePath(path, language)}
          hrefLang={language}
          lang={language}
          aria-current={locale === language ? 'true' : undefined}
          aria-label={language === 'bg' ? 'Български' : 'English'}
          onClick={(event) => {
            // Language routes have separate root layouts. Preserve the current fragment/query on navigation.
            event.currentTarget.href = localePath(path, language) + window.location.search + window.location.hash;
          }}
        >
          {language.toUpperCase()}
        </a>
      ))}
    </fieldset>
  );
}
