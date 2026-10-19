import type { LunchWeek } from '../types/lunch';
import type { MenuCategory } from '../types/menu';

export function visibleLunchWeek(week: LunchWeek | null, date: string | null) {
  if (!week || !date || date > week.validUntil) return null;
  return week;
}

export function lunchIsOpen(week: LunchWeek | null, local: { date: string; time: string } | null) {
  return Boolean(
    week &&
    local &&
    local.date >= week.validFrom &&
    local.date <= week.validUntil &&
    week.weekdays.includes(new Date(local.date + 'T12:00:00Z').getUTCDay()) &&
    local.time >= week.hours.from &&
    local.time < week.hours.until,
  );
}

export function orderingMenu(
  regular: MenuCategory[],
  week: LunchWeek | null,
  local: { date: string; time: string } | null,
): MenuCategory[] {
  if (!lunchIsOpen(week, local) || !week?.items.length) return regular;
  return [...regular, { id: 'lunch', name: 'Обедно меню', items: week.items }];
}
