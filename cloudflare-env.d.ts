declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ORDERS_ENABLED?: string;
    RESERVATIONS_ENABLED?: string;
    CALLMEBOT_PHONE?: string;
    CALLMEBOT_API_KEY?: string;
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_CHAT_ID?: string;
  }
}
