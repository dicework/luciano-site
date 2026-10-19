import { access } from 'node:fs/promises';
import { menu } from '../content/menu.ts';
import { lunchWeek } from '../content/lunch.ts';

const items = [...menu.flatMap((category) => category.items), ...(lunchWeek?.items ?? [])];
for (const item of items) {
  if (item.image) {
    await access(new URL('../public' + item.image, import.meta.url)).catch(() => {
      throw new Error(`Missing photo for ${item.name}: ${item.image}`);
    });
  }
}
console.log(`Validated ${menu.length} menu categories, ${items.length} dishes and their photos.`);
