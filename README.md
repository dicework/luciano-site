# Лучиано · Restaurant website

Bulgarian and English restaurant website, built with React, TypeScript and Vinext on Cloudflare Workers. Pages CMS edits the menu files in this repository. D1 saves orders and reservation requests; the existing Telegram bot alerts the restaurant. Staff confirm every request. There is no payment gateway.

## Daily menu editing

Use the separate [Pages CMS portal](https://app.pagescms.org/dicework/luciano-site/main/file/menu). The owner edits **Основно меню**, **Обедно меню** and **Снимки на ястията** without API keys or a login on the restaurant website. See [the owner guide and connection status](docs/pages-cms.md).

Prices are entered in euros, such as `7.80` or `7,80`. The website converts them to integer cents and validates checkout against the current menu. A build rejects invalid prices, missing photos and duplicate IDs. Expired lunch menus are hidden; advancing the lunch dates invalidates old saved lunch items.

## Development

```sh
npm ci
npm run dev
```

The development server uses port 5173. Put local Telegram configuration in the ignored `.env.local` file using `.env.example`. Never commit credentials or customer data.

```sh
npm run typecheck
npm test
npm run build
npm start
```

The build produces `dist/server/` and `dist/client/`. `npm start` previews the built Worker. Tests use isolated local databases and mock notification providers; they send no real messages. `npm run lint` and `npm run format:check` check code style.

## Cloudflare deployment

`wrangler.jsonc` defines the `luciano-site` Worker, its D1 database, static assets and request settings. `build/cloudflare-worker.ts` loads the framework's request handler. `vite.config.ts` builds it for Cloudflare. `worker-configuration.d.ts` contains generated binding types; refresh it with `npm run types:cloudflare` after configuration changes.

```sh
npm run build
npm run db:migrate:remote
npm run deploy
```

The temporary address is `https://luciano-site.harizanovworks.workers.dev`. It is publicly accessible without a login code for sharing with friends, as authorized on 19 October 2026. Worker-level Cloudflare Access has been removed for this site. Version preview URLs remain disabled. Access is managed in Cloudflare, independently of the site code. Change `content/restaurant.ts` when a custom domain is ready.

Workers Builds is connected to `dicework/luciano-site`, branch `main`, root `/`, build command `npm run build`, deploy command `npm run deploy`. Database migrations are applied separately when the schema changes; ordinary menu edits require no migration. Pages CMS commits automatically trigger a deployment; the save-to-deploy flow has been verified. Preview-branch builds are disabled. The deployment token is limited to Workers Scripts Edit and Account Settings Read for this Cloudflare account.

Worker runtime secrets:

| Name                 | Purpose                                                         |
| -------------------- | --------------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN` | Existing BotFather token, stored only as a Cloudflare secret.   |
| `TELEGRAM_CHAT_ID`   | Fixed restaurant recipient, stored only as a Cloudflare secret. |

`ORDERS_ENABLED` and `RESERVATIONS_ENABLED` are set in the Wrangler configuration. The form is disabled if its database or notification configuration is unavailable. Optional CallMeBot support remains unconfigured until the owner chooses to activate it.

Cloudflare's local build tooling may generate ignored `dist/server/.dev.vars` from local environment values. It is not a deployment asset; never share the build directory or local environment files. Cloudflare builds need no Telegram credentials because those secrets stay on the deployed Worker.

## Main files

| Path                                          | Purpose                                                          |
| --------------------------------------------- | ---------------------------------------------------------------- |
| `.pages.yml`                                  | Bulgarian editor fields, hidden automatic IDs and photo picker.  |
| `content/menu.json`, `content/lunch.json`     | Editable menu content and lunch schedule.                        |
| `public/images/menu/`                         | Dish photos managed through Pages CMS.                           |
| `lib/menu-content.ts`                         | Content validation and euro-to-cent conversion.                  |
| `content/restaurant.ts`, `content/gallery.ts` | Business details, deployment address and gallery.                |
| `components/pages/`                           | Shared page content.                                             |
| `app/(bg)/`, `app/en/`                        | Bulgarian and English routes.                                    |
| `i18n/`                                       | Translations and language switching.                             |
| `lib/server/`, `app/api/`                     | Order and reservation validation, persistence and notifications. |
| `db/schema.ts`, `drizzle/`                    | Database schema and migration history.                           |

## Request behavior

Orders and reservations are saved before notifying the fixed Telegram recipient. Repeated submissions with the same request ID are deduplicated; requests are limited per source and phone. The server checks prices, quantities, current lunch hours and reservation dates. Provider acceptance means the notification was accepted, not that the restaurant confirmed the request. Ambiguous notification failures are not retried automatically.

D1 contains submitted contact details and request contents. There is no public endpoint to read them. Database access is restricted to the Cloudflare account; apply the restaurant's retention policy. This deployment uses a new database and does not move records from the previous ChatGPT Site.

The cart stores only unsubmitted item IDs and quantities in the browser. Contact details and draft notes are not persisted locally. Language switches and navigation use normal document links; cart items survive them. BG/EN share menu IDs, prices and availability. Optional English fields in Pages CMS override translation fallbacks.

## Content sources

Menu and business information were imported from the restaurant's existing website on 6 September 2026: 79 dishes across nine categories. Photos are reused under the redesign brief; see `docs/assets.md` and `docs/menu-images.json`. Review prices and availability with the restaurant before public launch. The supplied lunch menu covers 5–9 October 2026 and is intentionally expired until the owner updates it.

The earlier ChatGPT Site remains separate. Legacy Sites support files are retained for that environment; the Cloudflare deployment uses `wrangler.jsonc` and the standalone entry described above.
