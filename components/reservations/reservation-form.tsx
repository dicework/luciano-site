'use client';
import { useI18n } from '@/components/i18n/language-provider';
import { useRestaurantTime } from '@/components/cart/cart-provider';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Check } from 'lucide-react';
import { restaurant } from '@/content/restaurant';
import type { OrderReceipt } from '@/lib/checkout';
import { useMessagingTest } from '@/components/messaging-test-provider';
import { validateReservation, type Reservation } from '@/lib/order';
export function ReservationForm() {
  const { locale, t } = useI18n();
  const test = useMessagingTest();
  const testMode = Boolean(test.phone || test.error);
  const minDate = useRestaurantTime()?.date ?? '';
  const [draft, setDraft] = useState<Reservation | null>(null);
  const [request, setRequest] = useState<Reservation | null>(null);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const attempt = useRef<{ fingerprint: string; id: string } | null>(null);
  const submitting = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/reservations/', {
      cache: 'no-store',
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ available?: boolean }>;
      })
      .then((data) => setAvailable(data.available === true))
      .catch(() => {
        if (!controller.signal.aborted) setAvailable(false);
      });
    return () => controller.abort();
  }, []);
  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current || !available || testMode) return;
    const f = new FormData(e.currentTarget);
    const field = (key: string) => {
      const value = f.get(key);
      return typeof value === 'string' ? value : '';
    };
    const r: Reservation = {
      name: field('name'),
      phone: field('phone'),
      address: field('address'),
      guests: Number(f.get('guests')),
      date: field('date'),
      time: field('time'),
      notes: field('notes'),
    };
    const failure = validateReservation(r, new Date(), locale);
    if (failure) {
      setError(failure);
      return;
    }
    setError('');
    setDraft(r);
    const fingerprint = JSON.stringify({ ...r, locale });
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, id: crypto.randomUUID() };
    submitting.current = true;
    setBusy(true);
    try {
      const response = await fetch('/api/reservations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...r, locale, requestId: attempt.current.id }),
        signal: AbortSignal.timeout(15000),
      });
      const result = (await response.json()) as Partial<OrderReceipt> & { error?: string; message?: string };
      if (!response.ok) {
        setError(
          result.error === 'limited' ?
            t('Твърде много опити. Изчакайте малко или ни се обадете.')
          : (result.message ??
              t('Не успяхме да потвърдим записването. Опитайте отново със същите данни или ни се обадете.')),
        );
        return;
      }
      if (typeof result.reference !== 'string' || typeof result.notified !== 'boolean') throw new Error();
      setReceipt({ reference: result.reference, notified: result.notified });
      setRequest(r);
    } catch {
      setError(t('Не успяхме да потвърдим записването. Опитайте отново със същите данни или ни се обадете.'));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="reservation-card">
      {request ?
        <>
          <p className="eyebrow">
            <Check size={16} />
            {t('ЗАПИТВАНЕТО Е ЗАПИСАНО')}
          </p>
          <h2>{t('Очаквайте потвърждение.')}</h2>
          <p>
            {receipt?.notified ?
              t('Ресторантът е уведомен. Очаквайте обаждане за потвърждение.')
            : t('Известието до ресторанта не е потвърдено. Моля, обадете се и посочете номера на заявката.')}
          </p>
          <div className="reservation-summary">
            <strong>{request.name}</strong>
            <span>
              {request.guests}
              {t(request.guests === 1 ? ' гост ·' : ' гости ·')} {request.date.split('-').reverse().join('.')} ·{' '}
              {request.time}
            </span>
            <span>{request.phone}</span>
            <span>{request.address}</span>
          </div>
          <p className="small">{t('Резервацията е валидна само след потвърждение от ресторанта.')}</p>
          <p>
            {t('Номер на заявката:')} <code className="checkout-reference">{receipt?.reference}</code>
          </p>
          <div className="reservation-actions">
            <a className="btn btn-outline" href={'tel:' + restaurant.phone}>
              {t('Обадете се:')} {restaurant.displayPhone}
            </a>
            <button
              className="text-link"
              onClick={() => {
                setRequest(null);
                setReceipt(null);
                setDraft(null);
                attempt.current = null;
              }}
            >
              {t('Ново запитване')}
            </button>
          </div>
        </>
      : <>
          <p className="eyebrow">
            <CalendarDays size={16} />
            {t(' ВАШИЯТ СЛЕДВАЩ ХУБАВ МОМЕНТ')}
          </p>
          <h2>{t('Запазете си място.')}</h2>
          <p>{t('Изпратете запитване за маса. Нашият екип ще потвърди резервацията лично.')}</p>
          <form onSubmit={submit} className="reservation-form">
            <fieldset disabled={busy}>
              <legend className="sr-only">{t('Данни за резервацията')}</legend>
              <p className="small">{t('Полетата с * са задължителни.')}</p>
              <label className="field">
                <span>
                  {t('Вашето име')} <span aria-hidden="true">*</span>
                </span>
                <input
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={80}
                  placeholder={t('Име и фамилия')}
                  defaultValue={draft?.name}
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
                  maxLength={20}
                  placeholder="+359…"
                  defaultValue={draft?.phone}
                />
              </label>
              <label className="field">
                <span>
                  {t('Адрес')} <span aria-hidden="true">*</span>
                </span>
                <input
                  name="address"
                  autoComplete="street-address"
                  required
                  minLength={5}
                  maxLength={300}
                  placeholder={t('Улица, номер, вход, етаж, апартамент')}
                  defaultValue={draft?.address}
                />
              </label>
              <div className="form-row">
                <label className="field">
                  <span>
                    {t('Дата')} <span aria-hidden="true">*</span>
                  </span>
                  <input name="date" type="date" required min={minDate} defaultValue={draft?.date} />
                </label>
                <label className="field">
                  <span>
                    {t('Час')} <span aria-hidden="true">*</span>
                  </span>
                  <input
                    name="time"
                    type="time"
                    required
                    min="08:00"
                    max="21:30"
                    step="900"
                    defaultValue={draft?.time ?? '19:00'}
                  />
                </label>
              </div>
              <label className="field">
                <span>
                  {t('Брой гости')} <span aria-hidden="true">*</span>
                </span>
                <input name="guests" type="number" required min={1} max={30} defaultValue={draft?.guests ?? 2} />
              </label>
              <label className="field">
                {t('Нещо, което да знаем?')} <span className="optional">{t('(по желание)')}</span>
                <textarea
                  name="notes"
                  defaultValue={draft?.notes}
                  rows={3}
                  maxLength={500}
                  placeholder={t('Детско столче, повод или друго желание…')}
                />
              </label>
            </fieldset>
            {testMode && (
              <p className="notice" role="status">
                {t(
                  'Автоматичните резервации са изключени в тестов режим. Излезте от теста, за да изпратите запитване.',
                )}
              </p>
            )}
            {available === false && (
              <p className="notice" role="status">
                {t('Онлайн резервациите временно не са достъпни. Моля, обадете се.')}{' '}
                <a href={'tel:' + restaurant.phone}>{restaurant.displayPhone}</a>
              </p>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-red" type="submit" disabled={busy || !available || testMode || !test.ready}>
              {busy ?
                t('Изпращане…')
              : available === null ?
                t('Проверка…')
              : t('Изпрати запитването')}
              <ArrowRight size={18} />
            </button>
            <p className="small">
              {t(
                'Името, телефонът, адресът и запитването се записват и изпращат на ресторанта за потвърждение на резервацията.',
              )}
            </p>
          </form>
        </>
      }
    </div>
  );
}
