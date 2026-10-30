'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n/language-provider';
import { messagingTestKey, readMessagingTest } from '@/lib/messaging-test';

const MessagingTestContext = createContext({ phone: null as string | null, error: false, ready: false });

export function MessagingTestProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [test, setTest] = useState({ phone: null as string | null, error: false, ready: false });

  useEffect(() => {
    let memoryPhone: string | null = null;
    function restore() {
      let storedPhone = memoryPhone;
      try {
        storedPhone = sessionStorage.getItem(messagingTestKey);
      } catch {
        // The link still works on this page when browser storage is unavailable.
      }
      const current = readMessagingTest(window.location.hash, storedPhone);
      memoryPhone = current.error ? 'invalid' : current.phone;
      try {
        if (memoryPhone) sessionStorage.setItem(messagingTestKey, memoryPhone);
        else sessionStorage.removeItem(messagingTestKey);
      } catch {
        // Keep the current test in memory for client-side navigation.
      }
      setTest({ ...current, ready: true });
    }
    restore();
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, []);

  function stop() {
    // Explicitly turn the test off, including when opening the same link again.
    window.location.hash = 'test-phone=off';
  }

  return (
    <MessagingTestContext.Provider value={test}>
      {(test.phone || test.error) && (
        <aside className="messaging-test-banner" aria-label={t('Тестов режим')}>
          <span>
            {test.error ?
              t('Невалиден тестов номер. Изпращането е изключено.')
            : <>
                {t('Тестов режим: WhatsApp и Viber към: ')}
                <strong>{test.phone}</strong>
              </>
            }
          </span>
          <button type="button" onClick={stop}>
            {t('Изход от теста')}
          </button>
        </aside>
      )}
      {children}
    </MessagingTestContext.Provider>
  );
}

export const useMessagingTest = () => useContext(MessagingTestContext);
