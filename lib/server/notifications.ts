export type NotificationConfig = {
  CALLMEBOT_PHONE?: string;
  CALLMEBOT_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
};
export type NotificationResult = { channel: 'whatsapp' | 'telegram'; status: 'accepted' | 'failed' | 'unknown' };

export function notificationChannels(config: NotificationConfig) {
  return {
    whatsapp: Boolean(config.CALLMEBOT_API_KEY && /^\+?\d{7,15}$/.test(config.CALLMEBOT_PHONE ?? '')),
    telegram: Boolean(config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_CHAT_ID),
  };
}

// Responses may contain credentials or phone numbers: never log or return their text.
export async function boundedText(response: Pick<Response, 'body'>) {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 16384) throw new Error('oversize');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}

export async function notifyOwner(
  config: NotificationConfig,
  message: string,
  send: typeof fetch = fetch,
): Promise<NotificationResult[]> {
  const channels = notificationChannels(config);
  const jobs: Promise<NotificationResult>[] = [];
  if (channels.whatsapp)
    jobs.push(
      (async () => {
        try {
          const url = new URL('https://api.callmebot.com/whatsapp.php');
          url.search = new URLSearchParams({
            phone: config.CALLMEBOT_PHONE!,
            apikey: config.CALLMEBOT_API_KEY!,
            text: message,
          }).toString();
          // Workers supports manual redirects; a non-2xx response is rejected below.
          const response = await send(url, { signal: AbortSignal.timeout(8000), redirect: 'manual' });
          const body = await boundedText(response);
          return {
            channel: 'whatsapp',
            status:
              !response.ok || /(?:error|failed)/i.test(body) ? 'failed'
              : /message (?:queued|sent)/i.test(body) ? 'accepted'
              : 'unknown',
          };
        } catch {
          return { channel: 'whatsapp', status: 'unknown' };
        }
      })(),
    );
  if (channels.telegram)
    jobs.push(
      (async () => {
        try {
          const response = await send(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: config.TELEGRAM_CHAT_ID, text: message }),
            signal: AbortSignal.timeout(8000),
            redirect: 'manual',
          });
          const body = await boundedText(response);
          if (!response.ok) return { channel: 'telegram', status: 'failed' };
          const result = JSON.parse(body) as { ok?: boolean };
          return { channel: 'telegram', status: result.ok === true ? 'accepted' : 'failed' };
        } catch {
          return { channel: 'telegram', status: 'unknown' };
        }
      })(),
    );
  return Promise.all(jobs);
}
