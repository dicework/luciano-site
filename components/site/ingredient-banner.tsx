import { getTranslator, type Locale } from '@/i18n';
export function IngredientBanner({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  return (
    <section className="ingredient-banner" aria-label={t('Нашата философия')}>
      <p>
        {t('Прости съставки.')}
        <span>{t('Незабравим вкус.')}</span>
      </p>
    </section>
  );
}
