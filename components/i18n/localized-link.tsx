'use client';
import type { ComponentProps } from 'react';
import { useI18n } from './language-provider';
import { localePath } from '@/i18n';
type LocalizedLinkProps = Omit<ComponentProps<'a'>, 'href'> & { href: string };

export default function LocalizedLink({ href, children, ...props }: LocalizedLinkProps) {
  const { locale } = useI18n();
  // Native navigation avoids the broken navigation exports in Vinext's production Link bundle.
  return (
    <a {...props} href={href.startsWith('/') && !href.startsWith('//') ? localePath(href, locale) : href}>
      {children}
    </a>
  );
}
