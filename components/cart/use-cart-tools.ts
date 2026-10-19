'use client';
import { useEffect, useEffectEvent } from 'react';
import type { CartLine, MenuCategory } from '@/types/menu';
import { reconcileCart, resolveCart } from '@/lib/order';
type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => unknown;
};
type ModelDocument = Document & {
  modelContext?: {
    registerTool: (tool: Tool, options: { signal: AbortSignal }) => void | Promise<void>;
  };
};
export function useCartTools(ready: boolean, menu: MenuCategory[], onStage: (items: CartLine[]) => CartLine[]) {
  const stage = useEffectEvent(onStage);
  useEffect(() => {
    if (!ready) return;
    const context = (document as ModelDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools: Tool[] = [
      {
        name: 'read_restaurant_menu',
        description: 'Read available restaurant categories, item IDs, sizes and prices in euro cents.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: () => menu,
      },
      {
        name: 'stage_order_items',
        description:
          'Add items to the local order and open its summary. Does not send an order or contact the restaurant.',
        inputSchema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              minItems: 1,
              maxItems: 30,
              items: {
                type: 'object',
                properties: {
                  itemId: { type: 'string' },
                  variantId: { type: 'string' },
                  quantity: { type: 'integer', minimum: 1, maximum: 99 },
                },
                required: ['itemId', 'variantId', 'quantity'],
                additionalProperties: false,
              },
            },
          },
          required: ['items'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (input) => {
          if (
            !input ||
            typeof input !== 'object' ||
            !('items' in input) ||
            !Array.isArray(input.items) ||
            !input.items.length ||
            input.items.length > 30
          )
            throw new Error('Expected 1–30 items.');
          const items = input.items;
          for (const item of items) {
            if (
              !item ||
              !Number.isInteger(item.quantity) ||
              item.quantity < 1 ||
              item.quantity > 99 ||
              reconcileCart([item], menu).length !== 1
            )
              throw new Error('Invalid or unavailable menu item.');
          }
          const next = stage(items);
          return { status: 'staged', items: resolveCart(next, menu) };
        },
      },
    ];
    for (const tool of tools) {
      try {
        void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {});
      } catch {}
    }
    return () => lifecycle.abort();
  }, [ready, menu]);
}
