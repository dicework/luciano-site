# Editing with Pages CMS

The owner uses the separate [Pages CMS portal](https://app.pagescms.org/dicework/luciano-site/main/file/menu). The restaurant website has no editor login or CMS application to install. This follows the file-based approach prepared for iSystem.

## Everyday editing

- **Основно меню:** open a category, open a dish, change its name, ingredients, photo or portion prices. Enter prices in euros, for example `7.80` or `7,80`. Add, remove or reorder dishes in the list. Turn off **Може да се поръчва** for sold-out dishes; they remain visible as unavailable.
- **Седмично обедно меню:** edit one shared list of dishes for the whole week. Set its start/end dates and serving hours. The selected weekdays only control when that same menu is available; there are no separate daily menus. Enable **Обедното меню е готово за публикуване** when ready. The website hides expired lunch menus automatically. All times are Bulgarian local time.
- **Снимки на ястията:** upload or select photos. Use the photo picker inside a dish to assign its photo.
- English fields are optional. Existing translation fallbacks remain; newly added dishes need an English name/description if an English translation is wanted.

Save in Pages CMS. Saved edits automatically trigger a Cloudflare build and appear after it succeeds, typically in one to two minutes. Technical IDs are generated automatically and hidden from the owner.

## Files

| File/folder                           | Purpose                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `.pages.yml`                          | The portal's Bulgarian fields and photo-library configuration.              |
| `content/menu.json`                   | Main-menu categories, dishes, photos and euro prices.                       |
| `content/lunch.json`                  | Lunch dates, hours, dishes, photos and euro prices.                         |
| `content/menu.ts`, `content/lunch.ts` | Small adapters that load and validate the JSON for the existing website.    |
| `lib/menu-content.ts`                 | Validates content and converts euro prices into integer cents for checkout. |
| `public/images/menu/`                 | The dish photo library used by Pages CMS and the website.                   |

There is no separate CMS package, dependency installation, CMS API token or runtime menu request. Orders and reservations continue to use the existing server and Telegram integration.

## Connection status

The source repository is [dicework/luciano-site](https://github.com/dicework/luciano-site), branch `main`. The separate Cloudflare Worker is `luciano-site`, with its own order/reservation database and the existing Telegram secrets. The temporary site is publicly accessible without a login code, as authorized on 19 October 2026. Only Luciano’s Worker-level Access protection was removed.

The site uses [luchianopizza.com](https://luchianopizza.com), with `www.luchianopizza.com` connected to the same Worker. The [public preview](https://luciano-site.harizanovworks.workers.dev) remains available. Its public pages and dish photos can be opened without authentication. The standalone build, type check and all 36 tests pass; local navigation, language switching and both forms were checked. Pages CMS edits continue to publish automatically to these addresses.

Pages CMS is connected and a menu save has been verified to create a GitHub commit and a successful automatic Cloudflare deployment. Both main-menu and weekly lunch-menu saves have been checked. Prices accept either a decimal comma or a dot. Existing dish and portion identifiers are preserved, while new entries receive hidden automatic identifiers.

Workers Builds watches `main`, with root `/`, build command `npm run build`, deploy command `npm run deploy`, and preview-branch builds disabled. Its token has only Workers Scripts Edit and Account Settings Read for the selected Cloudflare account. Runtime Telegram secrets remain on the Worker.

When the restaurant owner's email and invitation are authorized, invite them through Pages CMS collaborator settings. The current portal access belongs to the connected GitHub account. Do not share developer credentials.

The owner needs no Cloudflare dashboard access, API keys or command-line tools for everyday menu edits. The previous ChatGPT Site remains separate and unchanged.

References: [Pages CMS configuration](https://pagescms.org/docs/configuration/), [fields and files](https://pagescms.org/docs/configuration/content/), [collaborators](https://pagescms.org/docs/configuration/collaborators/), [Cloudflare automatic builds](https://developers.cloudflare.com/workers/ci-cd/builds/).
