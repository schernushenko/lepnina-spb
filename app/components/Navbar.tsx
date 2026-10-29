'use client';

import Link from 'next/link';
import { useState } from 'react';

const links = [
  { href: '#portfolio', label: 'Проекты' },
  { href: '#calculator', label: 'Каталог' },
  { href: '#process', label: 'Как работаем' },
  { href: '#contacts', label: 'Контакты' }
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header sticky top-0 z-40 border-b border-[#e8e2d8]/80 bg-[#f7f5f0]/90 backdrop-blur-xl">
      <nav aria-label="Главная навигация" className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label="Эйдос — на главную">
          <span className="site-mark flex size-10 items-center justify-center rounded-full border border-[#bd9a70]/40 bg-white/70 text-[#96734d] transition-colors group-hover:bg-[#252720] group-hover:text-white">
            <svg aria-hidden="true" viewBox="0 0 32 32" fill="none" className="size-6">
              <path d="M5 26V15.5C5 9.7 9.7 5 15.5 5S26 9.7 26 15.5V26M3 26h26M10 26v-5h12v5M9 15h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              <circle cx="16" cy="12" r="1.4" fill="currentColor" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="block font-cinzel text-[15px] font-bold tracking-[0.1em] text-[#292b25]">ЭЙДОС</span>
            <span className="mt-1.5 block text-[9px] font-medium tracking-[0.08em] text-[#929087]">εἶδος · образ, форма, идея</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-[12px] font-medium text-[#68675f] transition-colors hover:text-[#9a754e]">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-5 lg:flex">
          <a href="#contacts" className="text-[12px] font-medium text-[#68675f] transition-colors hover:text-[#9a754e]">
            Обсудить проект
          </a>
          <a href="#calculator" className="site-nav-cta inline-flex h-10 items-center gap-2 rounded-full bg-[#292b25] px-5 text-[11px] font-medium text-white transition-colors hover:bg-[#45463d]">
            Подобрать декор
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-3.5">
              <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        <button
          type="button"
          className="site-menu-toggle flex size-10 items-center justify-center rounded-full border border-[#e4ded3] text-[#373830] transition-colors hover:bg-white lg:hidden"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
              <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-navigation" className="site-mobile-menu border-t border-[#e8e2d8] bg-[#f7f5f0] px-5 pb-5 pt-3 lg:hidden">
          <div className="mx-auto flex max-w-[1440px] flex-col">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="border-b border-[#e8e2d8] py-3.5 text-sm font-medium text-[#4c4c45]">
                {link.label}
              </a>
            ))}
            <a href="#calculator" onClick={() => setMenuOpen(false)} className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#292b25] text-sm font-medium text-white">
              Подобрать декор
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4">
                <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
