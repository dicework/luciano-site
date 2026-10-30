# Asset provenance

Restaurant website: https://www.luchianopizza.com/
Accessed 2026-09-06. Reused for this restaurant redesign under the user's instruction to reuse restaurant assets. No third-party stock photography or fabricated restaurant scenes.

| Local WebP     | Restaurant source             |
| -------------- | ----------------------------- |
| hero.webp      | /food-3.jpg                   |
| interior.webp  | /hero-2.jfif                  |
| caprese.webp   | /food-8.jpg                   |
| seafood.webp   | /food-2.jpg                   |
| dessert.webp   | /food-4.jpg                   |
| pizza.webp     | /food-17.jpg                  |
| luciano.webp   | /img/menu/pizza-luciano.png   |
| carbonara.webp | /img/menu/pasta-carbonara.png |

`hero-pizza.webp` (1266 × 1243, transparent background) is the restaurant's burrata pizza photo with the white background removed. It is the home page hero and is shown whole, uncropped.

URLs are relative to the source website above. Images resized/compressed to WebP. Gallery JPGs show the restaurant and food. The two exact menu PNGs are the restaurant's published product representations and appear processed; their status as unaltered photography is unverified. No claim is made that all food imagery is unedited photography.

Fonts: self-hosted Cormorant Garamond and Manrope from Fontsource, including Cyrillic. Original font licensing is in their installed packages (SIL OFL).

Menu imported once and now stored in content/menu.json; no live dependency on the original website.

## Full photo menu — 2026-10-06

Imported the restaurant's published image assignments for all 79 menu items,
stored locally as 74 WebP assets under `public/images/menu/` (700px maximum
width, approximately 3.05 MB total). `docs/menu-images.json` records each item,
source URL, dimensions and duplicates. They are published product images;
their origin as unaltered photography remains unverified. No generated or
stock substitutions were introduced.

The source reuses five starter images for the corresponding side portions.
It also supplies identical images under different filenames for fried white
cheese / fried yellow cheese and blue-cheese focaccia / cheese flatbread.
These assignments follow the source listings and should be confirmed with the
restaurant when preparing final photography.

## Reference-inspired decorative artwork

Generated with the built-in imagegen tool on 2026-09-06. Original decorative artwork based on the user's supplied banner and feature references; these are illustrations, not restaurant photographs. WebP compression preserves the icon atlas alpha channel.

- Final banner: [ingredient-banner.webp](/Users/vh/Documents/ChatGPT/Luciano/public/images/ingredient-banner.webp)
- Final icon atlas: [feature-icons.webp](/Users/vh/Documents/ChatGPT/Luciano/public/images/feature-icons.webp)

### Banner prompt

Use case: stylized-concept.
Asset type: original decorative ingredient banner artwork for an Italian restaurant website, standalone raster asset.
Input image: supplied banner screenshot is a style and composition reference only, not an edit target.
Create a very wide horizontal editorial Italian ingredient banner, preferably 6:1 aspect ratio, or 3:1 if limited. Flat uniform warm cream #f8f5ec backdrop. Painterly-realistic fresh basil leaves and olive leaves, green and black olives, small cut tomato halves, a few subtle crumbs. Ingredients clustered only at the far left and far right edges; the central 40 percent must remain completely blank cream for a live HTML phrase. Keep every important ingredient within the central horizontal band, leaving generous blank cream above and below so modest vertical cropping does not cut important details. Refined vintage Italian food editorial aesthetic with natural delicate shadows, similar to the ingredient strip in the reference. Original decorative artwork, not a photograph of a real restaurant. No text, no lettering, no typography, no interface, no borders, no plates, no watermark.

### Feature icons prompt

Use case: stylized-concept.
Asset type: standalone horizontal raster icon atlas for restaurant feature cards.
Input image: supplied four-feature screenshot is a hand-drawn line style reference only, not an edit target.
Create an evenly spaced horizontal atlas of exactly FOUR individual charcoal-colored hand-drawn outline icons on perfectly plain uniform warm cream #f8f5ec background. Wide landscape, desired 1536x384 or similar. Left to right: 1) a wood-fired domed pizza oven with an arched opening and small chimney, 2) a steaming bowl of pasta, 3) a round charcoal barbecue on legs with grill and a hint of flame, 4) a martini cocktail glass with garnish. Thin elegant imperfect pen lines like the supplied reference. Each icon centered in its equal-width cell, with generous padding, comparable visual scale, all fully contained and clearly separated. No overlap, no labels, no text, no shading, no background decorations, no dividers, no UI, no border, no watermark. Original decorative icon artwork.
