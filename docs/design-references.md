# Design references

Saved looks the owner likes. They set the direction for the site's visual language as a whole, not only for the component they appear on. They are references, not specs: nothing here is built yet, and no third-party design is to be copied one to one.

## Liquid glass over photography — saved 2026-11-06

Source: Instagram reel by code.xr, "Glassy Liquid Footer" (https://www.instagram.com/reel/DfXHLZVz0JI/), a 5-second demo footer for a made-up brand called "Vertix". The owner's note: "This looks nice." The source code is not public. The code panel in the reel shows an unrelated snippet, so any version for this site is our own build.

What the reel shows:

1. A frosted-glass slab rises from the bottom of the screen over a blurred interior photo. Its top edge wobbles like a water surface, then settles into a rounded panel.
2. The content fades in on the glass: brand, a one-line pitch with a newsletter field, link columns in an inner glass card, social icons.
3. A giant brand wordmark runs edge to edge along the bottom, cut out of the glass. The letters act as lenses, so the photo behind shows through sharp and slightly refracted.
4. Moving the cursor over the glass leaves circular ripples in it.
5. A day/night toggle spreads a dark circle out from the switch and the whole panel turns to night mode.

The qualities to carry over: warm photography behind translucent, softly blurred surfaces; generous rounded panels with a thin bright rim; one oversized wordmark used as a graphic element; motion that feels liquid and settles calmly.

How it maps to Luciano:

- Glass only reads with a photo behind it. The site's surfaces are flat dark olive (`--background: #191a16`), so a glass treatment needs warm food or terrace photography underneath. `hero.webp` suits this; `interior.webp` does not (a wide panorama with a TV in shot).
- The photo-filled wordmark translates directly: „Лучиано“ in Cormorant Garamond with the photo clipped to the letters. It works in every browser.
- The rising wave can be plain CSS or SVG, played once when the element scrolls into view. `framer-motion` is not a dependency; `tw-animate-css` is.
- True refraction and the cursor ripples rely on SVG displacement filters inside `backdrop-filter`, which only Chromium supports. Safari, so most iPhone visitors, would get plain blur, and phones have no cursor. Treat ripples as optional.
- The day/night toggle does not apply: the site is dark-only (`color-scheme: dark`).
- Any liquid motion must stop for visitors with reduced motion turned on.
