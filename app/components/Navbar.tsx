'use client';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-[#fcfbf9]/90 backdrop-blur-sm border-b border-[#b38b5d]/30 sticky top-0 z-50 w-full">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Логотип */}
        <Link href="/" className="font-cinzel text-xl font-bold text-[#2c2a28] uppercase tracking-widest">
          ЭЛЛАДА<span className="text-[#b38b5d]">.ДЕКОР</span>
        </Link>

        {/* Меню ссылок */}
        <div className="hidden md:flex gap-8 text-sm font-inter font-medium uppercase tracking-wider text-[#5a5249]">
          <Link href="/portfolio" className="hover:text-[#b38b5d] transition-colors">Портфолио</Link>
          <Link href="/reviews" className="hover:text-[#b38b5d] transition-colors">Отзывы</Link>
          <Link href="/contacts" className="hover:text-[#b38b5d] transition-colors">Контакты</Link>
        </div>

        {/* Мобильная кнопка (для телефонов) */}
        <button className="md:hidden text-[#2c2a28]">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  );
}