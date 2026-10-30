'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useI18n } from '@/components/i18n/language-provider';
import { useMessagingTest } from '@/components/messaging-test-provider';
import { restaurant } from '@/content/restaurant';
import { money, orderTotal } from '@/lib/order';
import { type CheckoutError, type OrderReceipt } from '@/lib/checkout';
import { MINIMUM_ORDER_MINOR, deliveryQuote } from '@/lib/delivery';
import { DeliveryZonesHint } from '@/components/cart/delivery-zones-hint';
import type { ResolvedLine } from '@/types/menu';

export function CheckoutForm({
  lines,
  receipt,
  onSubmitted,
  onNewOrder,
}: {
  lines: ResolvedLine[];
  receipt: OrderReceipt | null;
  onSubmitted: (receipt: OrderReceipt, submittedLines: ResolvedLine[]) => void;
  onNewOrder: () => void;
}) {
  const { locale, t } = useI18n();
  const test = useMessagingTest();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<CheckoutError | 'connection' | null>(null);
  const attempt = useRef<{ fingerprint: string; id: string } | null>(null);
  const submitting = useRef(false);
  const testMode = Boolean(test.phone || test.error);
  const quote = deliveryQuote(orderTotal(lines));
  const belowMinimum = quote.toMinimumMinor > 0;
  const minimumMessage = t('Минималната поръчка за доставка е {amount}.').replace(
    '{amount}',
    money(MINIMUM_ORDER_MINOR, locale),
  );

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/orders/', {
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((result: unknown) =>
        setAvailable(
          Boolean(result && typeof result === 'object' && 'available' in result && result.available === true),
        ),
      )
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false);
      });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !available || testMode || belowMinimum) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    const payload = {
      name,
      phone,
      address,
      notes,
      locale,
      lines: lines.map(({ itemId, variantId, quantity }) => ({ itemId, variantId, quantity })),
      expectedTotalMinor: quote.totalMinor,
    };
    const fingerprint = JSON.stringify(payload);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, id: crypto.randomUUID() };
    try {
      const response = await fetch('/api/orders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, requestId: attempt.current.id }),
        signal: AbortSignal.timeout(15000),
      });
      const result = (await response.json()) as Partial<OrderReceipt> & { error?: CheckoutError };
      if (!response.ok) {
        setError(result.error ?? 'unavailable');
        return;
      }
      if (typeof result.reference !== 'string' || typeof result.notified !== 'boolean') throw new Error();
      onSubmitted({ reference: result.reference, notified: result.notified }, lines);
    } catch {
      setError('connection');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const errors = {
    invalid: t('Моля, проверете данните за поръчката.'),
    name: t('Моля, въведете вашето име.'),
    phone: t('Моля, въведете валиден телефон.'),
    address: t('Моля, въведете адрес за доставка (между 5 и 300 знака).'),
    items: t('За голяма поръчка, моля, обадете се на ресторанта.'),
    minimum: minimumMessage,
    changed: t('Менюто е променено. Презаредете страницата и проверете поръчката.'),
    unavailable: t('Онлайн поръчките временно не са достъпни. Моля, обадете се.'),
    limited: t('Твърде много опити. Изчакайте малко или ни се обадете.'),
    conflict: t('Поръчката е променена. Презаредете страницата преди нов опит.'),
    connection: t('Не успяхме да потвърдим записването. Опитайте отново със същите данни или ни се обадете.'),
  };

  if (receipt)
    return (
      <section className="checkout-result" aria-live="polite">
        <h3>{t('Заявката е записана.')}</h3>
        <p>
          {receipt.notified ?
            t('Ресторантът е уведомен. Очаквайте обаждане за потвърждение.')
          : t('Известието до ресторанта не е потвърдено. Моля, обадете се и посочете номера на заявката.')}
        </p>
        <p>
          {t('Номер на заявката:')} <code className="checkout-reference">{receipt.reference}</code>
        </p>
        <p className="small">{t('Поръчката е приета само след потвърждение от ресторанта.')}</p>
        <a className="btn btn-outline" href={'tel:' + restaurant.phone}>
          {t('Обадете се:')} {restaurant.phone}
        </a>
        <button className="btn btn-red" type="button" onClick={onNewOrder}>
          {t('Нова поръчка')}
        </button>
      </section>
    );

  return (
    <form className="checkout-form" onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend className="sr-only">{t('Данни за поръчката')}</legend>
        <p className="small">{t('Полетата с * са задължителни.')}</p>
        <label className="field">
          <span>
            {t('Име')} <span aria-hidden="true">*</span>
          </span>
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="field">
          <span>
            {t('Телефон')} <span aria-hidden="true">*</span>
          </span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            minLength={7}
            maxLength={25}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <label className="field">
          <span>
            {t('Адрес за доставка')} <span aria-hidden="true">*</span>
          </span>
          <input
            name="address"
            autoComplete="street-address"
            required
            minLength={5}
            maxLength={300}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder={t('Улица, номер, вход, етаж, апартамент')}
          />
        </label>
        <DeliveryZonesHint />
        <label className="field">
          <span>
            {t('Бележка към поръчката')} <span className="optional">{t('(по желание)')}</span>
          </span>
          <textarea
            name="notes"
            maxLength={500}
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t('Например: без лук…')}
          />
        </label>
      </fieldset>
      {testMode && (
        <p className="notice" role="status">
          {t('Автоматичните поръчки са изключени в тестов режим. Излезте от теста, за да поръчате.')}
        </p>
      )}
      {available === false && !testMode && !error && (
        <p className="notice" role="status">
          {errors.unavailable} <a href={'tel:' + restaurant.phone}>{restaurant.phone}</a>
        </p>
      )}
      {error && (
        <p className="notice" role="alert">
          {errors[error] ?? errors.invalid}
        </p>
      )}
      <p className="small">
        {t('Името, телефонът, адресът и поръчката се записват и изпращат на ресторанта за потвърждение.')}
      </p>
      {belowMinimum && (
        <output id="order-minimum" className="notice">
          {minimumMessage}{' '}
          {t('Добавете още {amount}, за да изпратите поръчката.').replace(
            '{amount}',
            money(quote.toMinimumMinor, locale),
          )}
        </output>
      )}
      <button
        className="btn btn-red"
        type="submit"
        aria-describedby={belowMinimum ? 'order-minimum' : undefined}
        disabled={!available || busy || testMode || !test.ready || belowMinimum}
      >
        {busy ?
          t('Изпращане…')
        : available === null ?
          t('Проверка на поръчките…')
        : t('Изпрати поръчката')}
      </button>
    </form>
  );
}
