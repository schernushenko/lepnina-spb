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

        {/* Меню ссылок - заменили на якоря */}
        <div className="hidden md:flex gap-8 text-sm font-inter font-medium uppercase tracking-wider text-[#5a5249]">
          <a href="#calculator" className="hover:text-[#b38b5d] transition-colors cursor-pointer">Калькулятор</a>
          <a href="#portfolio" className="hover:text-[#b38b5d] transition-colors cursor-pointer">Портфолио</a>
          <a href="#contacts" className="hover:text-[#b38b5d] transition-colors cursor-pointer">Контакты</a>
        </div>
      </div>
    </nav>
  );
}