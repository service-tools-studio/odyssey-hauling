'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { href: '/#services', label: 'Services' },
  { href: '/#process', label: 'How it works' },
  { href: '/#quote', label: 'Quote' },
  { href: '/#contact', label: 'Get started' },
];

export default function SiteHeader() {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [navOpen]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const close = () => {
      if (mq.matches) setNavOpen(false);
    };
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f7f1e7]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8 md:gap-5 md:px-12 lg:px-14 md:py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-1.5 md:flex-initial">
          <a href="/" className="flex shrink-0 items-center outline-offset-4 transition-opacity hover:opacity-90">
            <Image
              src="/odyssey-hauling-transparent.png"
              alt="Odyssey Hauling LLC"
              width={480}
              height={270}
              className="h-9 w-auto sm:h-11 md:h-12"
              priority
            />
          </a>
          <span
            className="min-w-0 text-[10px] font-semibold uppercase leading-snug tracking-[0.14em] text-[#784821] sm:text-[11px] md:text-xs"
            style={{
              fontFamily: '"Cormorant Garamond", "Cormorant Garamond Fallback", ui-serif, Georgia, "Times New Roman", serif',
            }}
          >
            <b>ODYSSEY HAULING LLC</b>
          </span>
        </div>

        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1.5 text-sm font-medium text-black/70 md:flex" aria-label="Primary">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={
                href === '/#contact'
                  ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5'
                  : 'shrink-0 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-black/[0.04] hover:text-[#1b1b1b]'
              }
            >
              {label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="-mr-1 inline-flex shrink-0 items-center justify-center rounded-xl p-2 text-[#171717] transition-colors hover:bg-black/[0.06] md:hidden"
          aria-expanded={navOpen}
          aria-controls="site-mobile-nav"
          onClick={() => setNavOpen((o) => !o)}
        >
          {navOpen ? <X className="h-6 w-6" strokeWidth={1.75} /> : <Menu className="h-6 w-6" strokeWidth={1.75} />}
          <span className="sr-only">{navOpen ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>

      {navOpen ? (
        <div
          id="site-mobile-nav"
          className="border-t border-black/10 bg-[#f2ebe0]/98 px-5 py-5 shadow-[0_12px_24px_rgba(0,0,0,0.06)] sm:px-8 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-0.5" aria-label="Primary mobile">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="rounded-xl px-3 py-3.5 text-base font-medium text-[#1b1b1b] transition-colors hover:bg-black/[0.05]"
                onClick={() => setNavOpen(false)}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
