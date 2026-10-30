# Restaurant logo assets

The owner supplied the black-and-gold circular restaurant badge on 28 October 2026.

- `public/images/brand/luchiano-badge.webp`: the supplied badge, proportionally resized to 512 × 512 and encoded as WebP. It was shown in the footer until the footer was reduced to three text columns; the file is kept for reuse.
- `public/images/brand/luchiano-wordmark.webp`: a transparent compact header adaptation, 640 × 218, retaining the gold Cyrillic lettering and green-white-red underline.

Browser, search-result and link-preview icons were made on 29 October 2026 from the owner's full-resolution 1254 × 1254 badge. The badge was cropped to its gold ring and resized only, with no artwork changes.

- `public/favicon.ico` (16, 32 and 48 px) and `public/icon.png` (192 × 192): the round badge with transparent corners, for browser tabs and Google search results.
- `public/apple-icon.png` (180 × 180): the badge on its square black ground. iOS rounds the corners itself.
- `public/images/brand/luchiano-logo.jpg` (800 × 800): the badge with a small black margin. It is the `og:image` for link previews in Viber, WhatsApp and Facebook, and the `logo` in the restaurant's structured data.

The header uses the same brand artwork in Bulgarian and English; the accessible home-link label is translated. The image dimensions are reserved to prevent layout shifts.

## Image editing

Tool: built-in image generation, editing the owner's supplied image with transparency enabled. Delivery assets are resized and encoded as WebP without additional creative edits.

Prompt:

> Use case: background-extraction. Edit target: the supplied restaurant badge. Create a compact website-header asset by isolating ONLY the large gold Cyrillic calligraphic word 'Лучиано' and the sweeping green-white-red brushstroke directly underneath it, exactly as they appear in the input. Preserve the original letter shapes, correct spelling Л-у-ч-и-а-н-о, gold/cream texture and Italian tricolor. Do not redesign or retype the lettering. Remove all black background to true transparent alpha, including inside letters. Remove the chef, pizza, oven, circular border, upper 'ПИЦАРИЯ' line, small bottom flag, and all other elements. Wide horizontal composition, tightly fitted around the word and underline with a small even transparent margin; the word must occupy almost the full width. The original descending strokes remain intact. No shadow, glow, checkerboard, solid backdrop, extra labels or new symbols. Intended to be legible at around 170 pixels wide on a dark olive website.
