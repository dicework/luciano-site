# Лучиано · Restaurant website

Next.js App Router conventions + React + TypeScript + Tailwind, built with the
Sites Vinext runtime on Cloudflare Workers. D1 stores submitted order requests.
There is no payment gateway. Bulgarian and English share the same menu and backend.

## Run

`npm install`
`npm run dev`

## Check and build

`npm run format:check`
`npm test`
`npm run typecheck`
`npm run build`

The build produces `dist/server/` and `dist/client/` for Sites hosting. `npm start`
previews the built Worker locally. `npm run dev` starts the development server
on port 5173. This site now requires its Worker and D1; `out/` is obsolete.
Tests use an isolated local Cloudflare database and mock all notification calls.

## Formatting

Run `npm run format` to format the project, or `npm run format:check` to check it
without writing files. Prettier 3.8.3 and `.prettierrc.json` match the installed
`agraya-cloud` configuration (`@osapiens-fso/prettier-config` 1.0.4): 120-column
width, two spaces, single quotes, semicolons, trailing commas, LF line endings,
and experimental ternary formatting. The config is copied locally so installing
this project does not require access to the private package registry. The
TypeScript override also includes Next.js TSX components; other file types use
Prettier's built-in parsers.

`.prettierignore` excludes generated output, lockfiles, and imported assets.
The workspace recommends the Prettier VS Code extension and enables formatting
on save when it is installed. Oxlint remains the linter; Prettier handles formatting.

## Edit the menu

The separate Pages CMS editor is configured in `.pages.yml`. See [the setup and owner guide](docs/pages-cms.md) for the current connection status and daily editing steps.

Categories, dishes, photos, availability and **euro prices** are stored in `content/menu.json`. The small `content/menu.ts` adapter validates those records and converts prices to cents for the existing cart and server checkout. Array order controls display order. IDs remain stable; Pages CMS generates IDs for new entries automatically.

A build validates the content and checks that all selected photos exist. No live CMS request is needed to browse or order. Content edits become visible after a successful rebuild and deployment; the GitHub-to-hosting connection is still required for automatic Pages CMS publishing.

Business details and the deployment origin: `content/restaurant.ts`.
Gallery images/captions: `content/gallery.ts`.
Page copy: `components/pages/`, shared components, and `content/restaurant.ts`.
English translations: `i18n/en.ts`.

## Languages

Bulgarian is the default at the existing URLs (`/`, `/menu/`, etc.). English
pages are available at `/en/`, `/en/menu/`, etc. The BG/EN switch stays on the
same page and preserves the query string and fragment. Both versions work on
the same Worker without language cookies or language middleware.

`i18n/` contains the lightweight dictionary-based i18n layer. Bulgarian source
messages are catalogue keys; add English entries in `i18n/en.ts` whenever you
change visible copy, dish names, descriptions, or portion labels. Use
`getTranslator(locale)` in server components and `useI18n()` in client
components. Use `LocalizedLink` for internal links. Locale formatting uses
`Intl` for EUR prices and lunch dates. User-entered names and notes remain as
entered. IDs, quantities, prices and availability are shared across languages.

`app/(bg)/` and `app/en/` are thin route wrappers around shared page components.
Separate root layouts emit the correct HTML language before hydration. Changing
language reloads the document: saved cart items survive; unsaved order notes
and reservation drafts do not. Both versions have localized metadata, canonical
URLs and language alternates in the sitemap. The fallback 404 document
displays explicitly labelled Bulgarian and English sections.
The multiple-root fallback uses Next.js's `experimental.globalNotFound` option.

Translation tests check all catalogue calls and published menu/business/gallery
content for missing English entries. A missing runtime translation falls back
to the source message; run `npm test` before publishing content changes.

## Weekly lunch menu

The homepage and `/lunch/` share `content/lunch.json`, loaded by `content/lunch.ts`.
Edit dates, weekdays, serving hours, dishes and euro prices in Pages CMS under **Обедно меню**. Disable `enabled` when the next menu is not confirmed. The supplied menu still covers 5–9 October 2026; no current-week dishes have been invented.

Dates use YYYY-MM-DD; weekday choices are stored as strings (`"1"` means Monday). Times use HH:mm in Europe/Sofia. The adapter adds the week date to lunch dish IDs, so advancing the week invalidates old saved lunch items automatically. Lunch ordering is allowed only inside the configured serving window; expired menus are hidden. English fields override the existing translation fallback.

The main menu uses photo cards and compact image rows for sauces and sides.
Dish images come from the restaurant's own published listings; source mapping
and duplicate-image caveats are recorded in `docs/menu-images.json`.

## Order and reservation behavior

### Automatic orders

The cart always has one **Place order** button and asks for the
customer's name and phone number. `/api/orders/` validates IDs, quantities,
current prices and Sofia lunch availability, saves the request to D1, then
notifies the fixed owner destinations. No messaging app is required by the
customer. Reservations continue to use the existing messaging handoff.

Runtime setup in Sites (never commit real values or use `NEXT_PUBLIC_` keys):

| Key                  | Purpose                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| `ORDERS_ENABLED`     | Set to `true` once credentials and delivery are verified. Defaults to disabled. |
| `CALLMEBOT_PHONE`    | Owner's activated WhatsApp number, including country code.                      |
| `CALLMEBOT_API_KEY`  | Secret received by the owner from CallMeBot.                                    |
| `TELEGRAM_BOT_TOKEN` | Secret bot token from Telegram's BotFather.                                     |
| `TELEGRAM_CHAT_ID`   | Fixed owner or staff chat that has started/added the bot.                       |

Configure either channel or both. Redeploy after changing hosted runtime values.
When ordering is unavailable, the same button is disabled with a notice and the
restaurant's phone number; WhatsApp/Viber buttons do not return to the cart.
Test-phone links disable automatic orders; they cannot redirect notifications.
Reservations retain their separate messaging handoff.
For local previews, put the same keys in the ignored root `.env.local` file.
`npm start` loads that file explicitly, including after a rebuild or restart.
Keep real credentials out of `dist/`, archives, and Git. Without local credentials,
the cart still shows the single-button flow with ordering disabled.

Follow [CallMeBot's activation guide](https://www.callmebot.com/blog/free-api-whatsapp-messages/)
on the owner's phone; its [shop-owner notification example](https://www.callmebot.com/blog/whatsapp-messages-from-shopify/)
describes this use. For Telegram, create a bot with [BotFather](https://t.me/BotFather)
and start it from the recipient chat. Real device delivery still needs a test
after credentials are configured; automated tests do not contact providers.

Each submission has a random idempotency key. Repeated clicks and concurrent
retries with the same key produce one saved request and one notification attempt
per configured channel. Requests are limited per source/phone to five per minute
and twenty per hour. The server never accepts prices or recipients from the client.
The browser clears submitted items after saving and shows an order reference.
Provider acceptance does not mean the restaurant accepted the order; staff must
call to confirm. On an unconfirmed notification, the customer is asked to call.

Saved `orders` rows contain the contact details, priced items, notes, reference,
timestamp and notification results. They are available to the Site owner through
the Sites database tools; there is no public order-reading endpoint. Notification
failures do not remove rows. Ambiguous provider responses are not retried
automatically because the provider may already have sent the message. Review
these orders manually and apply the restaurant's retention policy to contact data.

The schema is in `db/schema.ts`; generated migrations are in `drizzle/`. After
schema edits, run `npm run db:generate` and inspect the SQL. Sites applies hosted
migrations during publication. For a local database, build first, then apply each
pending migration once:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_outstanding_captain_universe.sql
```

### Cart and messaging handoff

The cart reducer updates selections and serving availability in one transition.
The provider has two effects for storage hydration/clock subscription and
persistence; the optional WebMCP registration has its own hook. Clock ticks
preserve menu/line identity unless lunch availability changes. Dish buttons
subscribe only to stable cart actions.

Unsubmitted cart contents stay in the browser. Only IDs and quantities are
persisted locally. Draft notes and reservation contact information are not
persisted locally. Submitted automatic orders are stored server-side as above.
Old/unavailable cart items are removed against the current menu; current prices
are always used.

WhatsApp opens an encoded message to the restaurant. Messaging settings live in
`content/restaurant.ts`: `whatsappNumber` and `viber.phone` default to the main
restaurant number and can be changed independently. Numbers require a country code.
Confirm that the chosen numbers are registered with each app.

Viber defaults to `account: 'personal'`: copy the text, open the phone chat, and
paste it. Clipboard failures reveal a selectable message; changed order notes
or quantities clear the copied indication. Phone deep-link support varies by
device, so the phone number and call link remain available.

For a **confirmed Viber Business account**, change `viber.account` to `'business'`.
The button then uses the official `https://viber.me/<number>?draft=<message>`
format, which opens the business chat with the complete draft. Confirm the number
against Viber → Business Account → Settings → Share Business before enabling it.
See [Viber's account and link requirements](https://help.viber.com/hc/en-us/articles/36712478644381-Get-your-Viber-chat-link-and-QR-code-for-Business-accounts)
and [WhatsApp click-to-chat](https://faq.whatsapp.com/5913398998672934).

Both channels use the selected language and the latest order/reservation details.
The customer reviews and sends in the app; no API keys or backend are needed for
this handoff. The website never claims a message was sent or a reservation was
accepted. Staff must confirm availability, amount, collection arrangements and
reservations. Rebuild and redeploy after changing messaging settings.

Reservation dates/times use Europe/Sofia, including DST. Browser calendar validation is backed by shared validation. There is no live table inventory.

## Phone tests

Open a page with `#test-phone=INTERNATIONAL_DIGITS` to route WhatsApp and Viber
drafts to a test recipient. For example, replace `INTERNATIONAL_DIGITS` with the
test phone number including its country code. The number lives in the link and
that tab's session storage; it is not embedded in the published source or menu.
Only share such a link with the intended testers.

A visible banner and recipient label identify test mode, and messages start
with a localized test label. Test mode uses regular Viber's copy-and-open flow
and survives internal navigation and language switching while session storage
is available. Invalid test numbers disable messaging. “Exit test mode” restores
the normal restaurant destinations; a new tab without a test session uses the
restaurant number. The main contact details and map remain the restaurant's.
Messaging app installation, account registration, and actual delivery still
need to be checked on physical devices. The website never sends automatically.

## Content sources

Menu and business information imported from https://www.luchianopizza.com/ on 2026-09-06. 79 dishes across 9 categories, with family pizzas merged into 50 cm variants. Review current prices/availability with the restaurant before public launch.

Photographs come from the restaurant's existing website, reused as authorized by the redesign brief. Asset source details: `docs/assets.md`. No generic stock images represent the restaurant.

## Hosting

`.openai/hosting.json` preserves the Site ID and declares the `DB` D1 binding.
The Sites build integration packages the Worker, assets and migrations. Change
`restaurant.siteUrl` when moving to a custom domain; canonical URLs and sitemap
use that value. Fonts are self-hosted. Images remain precompressed WebP.

## Validation scope

Focused automated tests cover menu integrity, money/cart behavior, message encoding and reservation dates. Browser and physical-device messaging checks should be performed before public launch. No messages are sent by automated tests.

Optional WebMCP exposes read-menu and stage-order tools only when the browser supports the API. These never send orders. Unsupported browsers retain the same full UI. Local browser checks verified successive staging calls, localized results and persisted cart items across language changes.
