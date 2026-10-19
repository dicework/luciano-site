import type { MenuItem } from './menu';

export interface LunchWeek {
  validFrom: string;
  validUntil: string;
  weekdays: number[];
  hours: { from: string; until: string };
  items: (MenuItem & { nameEn?: string })[];
}
