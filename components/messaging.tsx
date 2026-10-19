'use client';
import { useI18n } from '@/components/i18n/language-provider';
import { useId, useState } from 'react';
import { Copy, Check, Phone, ArrowUpRight, MessageCircle } from 'lucide-react';
import { restaurant } from '@/content/restaurant';
import { viberLink, whatsappLink } from '@/lib/messaging';
import { useMessagingTest } from '@/components/messaging-test-provider';
export function Messaging({ message, disabled = false }: { message: string; disabled?: boolean }) {
  const { t } = useI18n();
  const test = useMessagingTest();
  const draft = test.phone ? t('ТЕСТОВО СЪОБЩЕНИЕ') + '\n\n' + message : message;
  const whatsappNumber = test.phone ?? restaurant.whatsappNumber;
  const viberContact = test.phone ? { phone: test.phone, account: 'personal' as const } : restaurant.viber;
  const guideId = useId();
  const [copyState, setCopyState] = useState<{
    message: string;
    status: 'copying' | 'copied' | 'error';
  } | null>(null);
  const [viber, setViber] = useState(false);
  const copyStatus = copyState?.message === draft ? copyState.status : null;
  const unavailable = disabled || !message.trim() || !test.ready || test.error;
  const businessViber = viberContact.account === 'business';
  async function copy() {
    if (unavailable) return;
    setCopyState({ message: draft, status: 'copying' });
    try {
      await navigator.clipboard.writeText(draft);
      setCopyState({ message: draft, status: 'copied' });
    } catch {
      setCopyState({ message: draft, status: 'error' });
    }
  }
  return (
    <div className="messaging">
      {test.phone && (
        <p className="messaging-test-note">
          {t('Тестово съобщение до: ')}
          <strong>{test.phone}</strong>
        </p>
      )}
      {test.error && <p role="alert">{t('Невалиден тестов номер. Изпращането е изключено.')}</p>}
      <a
        className={'btn btn-green ' + (unavailable ? 'disabled-link' : '')}
        href={unavailable ? undefined : whatsappLink(draft, whatsappNumber)}
        aria-disabled={unavailable}
        tabIndex={unavailable ? -1 : undefined}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={18} />
        {t('Продължи в WhatsApp')}
        <ArrowUpRight size={16} />
      </a>
      {businessViber ?
        <a
          className={'btn btn-outline ' + (unavailable ? 'disabled-link' : '')}
          href={unavailable ? undefined : viberLink(draft, viberContact)}
          aria-disabled={unavailable}
          tabIndex={unavailable ? -1 : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={18} />
          {t('Продължи във Viber')}
          <ArrowUpRight size={16} />
        </a>
      : <button
          type="button"
          className="btn btn-outline"
          disabled={unavailable}
          aria-expanded={viber}
          aria-controls={guideId}
          onClick={() => {
            setViber(!viber);
            if (!viber) void copy();
          }}
        >
          <MessageCircle size={18} />
          {t('Продължи във Viber')}
        </button>
      }
      {viber && (
        <div className="viber-guide" id={guideId}>
          <p>
            {t(
              'Копирайте текста, отворете чата с посочения номер и го поставете във Viber. Изпращането става в приложението.',
            )}
          </p>
          <div className="actions">
            <button
              type="button"
              className="btn btn-outline"
              disabled={unavailable || copyStatus === 'copying'}
              onClick={() => void copy()}
            >
              {copyStatus === 'copied' ?
                <Check size={16} />
              : <Copy size={16} />}
              {t('Копирай текста')}
            </button>
            <a
              className={'btn btn-outline ' + (unavailable ? 'disabled-link' : '')}
              href={unavailable ? undefined : viberLink(draft, viberContact)}
              aria-disabled={unavailable}
              tabIndex={unavailable ? -1 : undefined}
            >
              {t('Отвори Viber ↗')}
            </a>
          </div>
          <p className="small">
            {t('Ако чатът не се отвори, добавете ')}
            {viberContact.phone}
            {t(' във Viber.')}
          </p>
          <output className="message-copy-status" aria-live="polite">
            {copyStatus === 'copied' && t('Текстът е копиран')}
            {copyStatus === 'error' && t('Копирането не е достъпно. Маркирайте и копирайте текста по-долу.')}
          </output>
          <textarea
            className="message-preview"
            aria-label={t('Текст за Viber')}
            readOnly
            value={draft}
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
      <p className="messaging-note">{t('Прегледайте и изпратете съобщението в приложението.')}</p>
      <a className="call-link" href={'tel:' + (test.phone ?? restaurant.phone)}>
        <Phone size={16} />
        {t('Или се обади: ')}
        {test.phone ?? restaurant.displayPhone}
      </a>
    </div>
  );
}
