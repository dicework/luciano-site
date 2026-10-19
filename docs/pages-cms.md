# Editing with Pages CMS

The owner uses the separate [Pages CMS portal](https://app.pagescms.org). The restaurant website has no editor login or CMS application to install. This follows the file-based approach prepared for iSystem.

## Everyday editing

- **Основно меню:** open a category, open a dish, change its name, ingredients, photo or portion prices. Enter prices in euros, for example `7.80`. Add, remove or reorder dishes in the list. Turn off **Може да се поръчва** for sold-out dishes; they remain visible as unavailable.
- **Обедно меню:** set the start/end dates, weekdays and serving hours, then edit the dishes. Enable **Обедното меню е готово за публикуване** when ready. The website hides expired lunch menus automatically. All times are Bulgarian local time.
- **Снимки на ястията:** upload or select photos. Use the photo picker inside a dish to assign its photo.
- English fields are optional. Existing translation fallbacks remain; newly added dishes need an English name/description if an English translation is wanted.

Save in Pages CMS. Once a GitHub-to-hosting build is connected, saved edits appear after that deployment succeeds. Technical IDs are generated automatically and hidden from the owner.

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

The source repository is [dicework/luciano-site](https://github.com/dicework/luciano-site), branch `main`. The separate Cloudflare Worker is `luciano-site`, with its own order/reservation database and the existing Telegram secrets. Cloudflare Access protects all traffic using the account owner's existing email policy.

Pages CMS sign-in and the GitHub-to-Cloudflare automatic-build connection are being completed. Until both are verified, saving in the portal is not a confirmed automatic publication workflow.

One-time setup:

1. Authorize `dicework/luciano-site` in Pages CMS. Preserve the existing iSystem connection.
2. In the Luciano Worker, connect Workers Builds to the same repository's `main` branch. Use root `/`, build command `npm run build`, and deploy command `npm run deploy`.
3. Verify a saved menu change reaches the private preview after a successful build.
4. Invite the owner through Pages CMS collaborator settings when their email and invitation are authorized.

The owner needs no Cloudflare dashboard access, API keys or command-line tools for everyday menu edits. The previous ChatGPT Site remains separate and unchanged.

References: [Pages CMS configuration](https://pagescms.org/docs/configuration/), [fields and files](https://pagescms.org/docs/configuration/content/), [collaborators](https://pagescms.org/docs/configuration/collaborators/), [Cloudflare automatic builds](https://developers.cloudflare.com/workers/ci-cd/builds/).
