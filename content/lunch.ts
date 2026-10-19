import content from './lunch.json' with { type: 'json' };
import { parseLunchWeek } from '../lib/menu-content.ts';

export const lunchWeek = parseLunchWeek(content);
