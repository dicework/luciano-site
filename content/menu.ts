import content from './menu.json' with { type: 'json' };
import { parseMenu } from '../lib/menu-content.ts';

export const menu = parseMenu(content);
