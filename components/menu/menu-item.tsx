'use client';
import { useI18n } from '@/components/i18n/language-provider';
import Image from 'next/image';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Check, Leaf, Flame } from 'lucide-react';
import type { MenuItem } from '@/types/menu';
import { money } from '@/lib/order';
import { useCartActions } from '@/components/cart/cart-provider';
export function MenuItemView({
  item,
  compact = false,
  disabled = false,
}: {
  item: MenuItem;
  compact?: boolean;
  disabled?: boolean;
}) {
  const { locale, t } = useI18n();
  const [variantId, setVariantId] = useState(
    item.variants.find((v) => v.available !== false)?.id ?? item.variants[0].id,
  );
  const [added, setAdded] = useState(false);
  const cart = useCartActions();
  const variant = item.variants.find((v) => v.id === variantId)!;
  return (
    <article className={compact ? 'menu-row' : 'menu-photo-card'} id={item.id}>
      {item.image && (
        <div className={compact ? 'menu-thumbnail' : 'menu-photo'}>
          <Image src={item.image} alt={item.name} width={700} height={525} loading="lazy" />
        </div>
      )}
      <div className="menu-card-body">
        <div className="menu-item-copy">
          <div className="dish-title">
            <h3>{item.name}</h3>
            {item.tags.includes('popular') && <span className="dish-tag">{t('Любим избор')}</span>}
            {item.tags.includes('vegetarian') && (
              <span title={t('Вегетарианско')} aria-label={t('Вегетарианско')}>
                <Leaf size={15} />
              </span>
            )}
            {item.tags.includes('spicy') && (
              <span title={t('Люто')} aria-label={t('Люто')}>
                <Flame size={15} />
              </span>
            )}
          </div>
          {item.description && <p>{item.description}</p>}
          {item.available === false ?
            <span className="unavailable">{t('Временно не е налично')}</span>
          : item.variants.length > 1 ?
            <RadioGroup
              className="variants !flex !w-auto"
              aria-label={t('Размер за ') + item.name}
              value={variantId}
              onValueChange={(value) => {
                setVariantId(String(value));
                setAdded(false);
              }}
            >
              {item.variants.map((v) => (
                <label key={v.id} className={variantId === v.id ? 'selected' : ''}>
                  <RadioGroupItem
                    value={v.id}
                    disabled={v.available === false}
                    className="!absolute !inset-0 !w-full !h-full !opacity-0 !rounded-none"
                  />
                  {v.label}
                </label>
              ))}
            </RadioGroup>
          : <span className="portion">{variant.label}</span>}
        </div>
        <div className="menu-item-action">
          <strong>{money(variant.priceMinor, locale)}</strong>
          <button
            className={'add-button ' + (added ? 'added' : '')}
            disabled={disabled || item.available === false || variant.available === false}
            aria-label={t('Добави ') + item.name + ', ' + variant.label}
            onClick={() => {
              setAdded(cart.add(item.id, variantId));
            }}
          >
            {added ?
              <Check size={18} />
            : <Plus size={18} />}
            <span>{added ? t('Добави още') : t('Добави')}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
