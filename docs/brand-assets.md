# Restaurant logo assets

The owner supplied the black-and-gold circular restaurant badge on 28 October 2026.

- `public/images/brand/luchiano-badge.webp`: the supplied badge, proportionally resized to 512 × 512 and encoded as WebP for the footer. No illustration or lettering redesign.
- `public/images/brand/luchiano-wordmark.webp`: a transparent compact header adaptation, 640 × 218, retaining the gold Cyrillic lettering and green-white-red underline. The original artwork remains in the footer.

The header uses the same brand artwork in Bulgarian and English; the accessible home-link label is translated. Both image dimensions are reserved to prevent layout shifts. The footer badge is loaded lazily; its black background blends into the dark footer with CSS.

## Image editing

Tool: built-in image generation, editing the owner's supplied image with transparency enabled. Delivery assets are resized and encoded as WebP without additional creative edits.

Prompt:

> Use case: background-extraction. Edit target: the supplied restaurant badge. Create a compact website-header asset by isolating ONLY the large gold Cyrillic calligraphic word 'Лучиано' and the sweeping green-white-red brushstroke directly underneath it, exactly as they appear in the input. Preserve the original letter shapes, correct spelling Л-у-ч-и-а-н-о, gold/cream texture and Italian tricolor. Do not redesign or retype the lettering. Remove all black background to true transparent alpha, including inside letters. Remove the chef, pizza, oven, circular border, upper 'ПИЦАРИЯ' line, small bottom flag, and all other elements. Wide horizontal composition, tightly fitted around the word and underline with a small even transparent margin; the word must occupy almost the full width. The original descending strokes remain intact. No shadow, glow, checkerboard, solid backdrop, extra labels or new symbols. Intended to be legible at around 170 pixels wide on a dark olive website.
