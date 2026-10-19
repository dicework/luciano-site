'use client';
import { useI18n } from '@/components/i18n/language-provider';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { gallery } from '@/content/gallery';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
export function GalleryGrid() {
  const { t } = useI18n();
  const [index, setIndex] = useState<number | null>(null);
  const current = index === null ? null : gallery[index];
  function move(delta: number) {
    setIndex((i) => (i === null ? 0 : (i + delta + gallery.length) % gallery.length));
  }
  return (
    <>
      <div className="wrap gallery-grid">
        {gallery.map((im, i) => (
          <button
            className={'gallery-item ' + im.kind}
            key={im.src}
            onClick={() => setIndex(i)}
            aria-label={t('Увеличи: ') + t(im.label)}
          >
            <Image src={im.src} alt={t(im.alt)} width={900} height={im.kind === 'wide' ? 550 : 1100} loading="lazy" />
            <span>
              {t(im.label)}
              <ArrowUpRight size={20} />
            </span>
          </button>
        ))}
      </div>
      <Dialog
        open={index !== null}
        onOpenChange={(open) => {
          if (!open) setIndex(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="lightbox !max-w-5xl"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') move(1);
            if (e.key === 'ArrowLeft') move(-1);
          }}
        >
          <DialogClose className="icon-button close-button" aria-label={t('Затвори снимката')}>
            <X />
          </DialogClose>
          <DialogTitle className="!text-2xl">{current ? t(current.label) : ''}</DialogTitle>
          <DialogDescription className="sr-only">{current ? t(current.alt) : ''}</DialogDescription>
          {current && <Image src={current.src} alt={t(current.alt)} width={1200} height={1000} />}
          <div className="lightbox-controls">
            <button className="icon-button" onClick={() => move(-1)} aria-label={t('Предишна снимка')}>
              <ChevronLeft />
            </button>
            <span>
              {(index ?? 0) + 1} / {gallery.length}
            </span>
            <button className="icon-button" onClick={() => move(1)} aria-label={t('Следваща снимка')}>
              <ChevronRight />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
