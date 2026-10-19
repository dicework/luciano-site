import { getTranslator, type Locale } from '@/i18n';
import { features } from '@/content/restaurant';

export function Features({ locale = 'bg' }: { locale?: Locale }) {
  const t = getTranslator(locale);
  return (
    <section className="features-section" aria-label={t('Нашите силни страни')}>
      <div className="wrap">
        <h2 className="features-caption">{t('Нашите силни страни')}</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <article key={feature.number}>
              <div
                className="feature-illustration"
                style={{ backgroundPosition: `${(index * 100) / 3}% center` }}
                aria-hidden="true"
              />
              <h3>{t(feature.title)}</h3>
              <p>{t(feature.text)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
