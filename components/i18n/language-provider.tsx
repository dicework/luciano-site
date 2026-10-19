'use client';
import { createContext, useContext, useMemo } from 'react';
import { getTranslator, type Locale } from '@/i18n';
const LanguageContext = createContext<Locale>('bg');
export function LanguageProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LanguageContext.Provider value={locale}>{children}</LanguageContext.Provider>;
}
export function useI18n() {
  const locale = useContext(LanguageContext);
  return useMemo(() => ({ locale, t: getTranslator(locale) }), [locale]);
}
