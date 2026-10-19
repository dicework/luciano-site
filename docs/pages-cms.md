# Editing with Pages CMS

The owner uses the separate [Pages CMS portal](https://app.pagescms.org). The restaurant website has no editor login or CMS application to install. This follows the file-based approach prepared for iSystem.

## Everyday editing

- **Основно меню:** open a category, open a dish, change its name, ingredients, photo or portion prices. Enter prices in euros, for example `7.80`. Add, remove or reorder dishes in the list. Turn off **Може да се поръчва** for sold-out dishes; they remain visible as unavailable.
- **Обедно меню:** set the start/end dates, weekdays and serving hours, then edit the dishes. Enable **Обедното меню е готово за публикуване** when ready. The website hides expired lunch menus automatically. All times are Bulgarian local time.
- **Снимки на ястията:** upload or select photos. Use the photo picker inside a dish to assign its photo.
- English fields are optional. Existing translation fallbacks remain; newly added dishes need an English name/description if an English translation is wanted.

Save in Pages CMS. Once a GitHub-to-hosting build is connected, saved edits appear after that deployment succeeds. Technical IDs are generated automatically and hidden from the owner.

## Files

| File/folder | Purpose |
| --- | --- |
| `.pages.yml` | The portal's Bulgarian fields and photo-library configuration. |
| `content/menu.json` | Main-menu categories, dishes, photos and euro prices. |
| `content/lunch.json` | Lunch dates, hours, dishes, photos and euro prices. |
| `content/menu.ts`, `content/lunch.ts` | Small adapters that load and validate the JSON for the existing website. |
| `lib/menu-content.ts` | Validates content and converts euro prices into integer cents for checkout. |
| `public/images/menu/` | The dish photo library used by Pages CMS and the website. |

There is no separate CMS package, dependency installation, CMS API token or runtime menu request. Orders and reservations continue to use the existing server and Telegram integration.

## One-time connection — still required

1. Choose a separate Luciano GitHub repository and put the website source, `.pages.yml`, `content/` and `public/` at its root. Never upload local `.env` files, dependencies, builds or database state.
2. Authorize that repository in Pages CMS and invite the restaurant owner through its collaborator settings. iSystem's repository connection does not connect Luciano automatically.
3. Connect changes on the same GitHub branch to a deployment pipeline for **this existing Worker application**, including its database and Telegram secrets. iSystem's static `dist` hosting settings cannot run Luciano's orders or reservations.
4. Test one menu price change, one uploaded photo and one lunch-menu edit through Pages CMS, then verify the resulting deployment.

The current ChatGPT Site source repository is not a GitHub repository. This change prepares the content and editor configuration; it does not claim a live Pages CMS connection or automatic publishing. Current Site publication continues through the existing Sites workflow until the GitHub deployment is connected.

References: [Pages CMS configuration](https://pagescms.org/docs/configuration/), [fields and files](https://pagescms.org/docs/configuration/content/), [collaborators](https://pagescms.org/docs/configuration/collaborators/).
