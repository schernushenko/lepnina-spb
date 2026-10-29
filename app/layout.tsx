import './globals.css';
import { Cinzel, Inter } from 'next/font/google';
import Navbar from './components/Navbar';
import AOSInit from './components/AOSInit'; // Мы создадим этот компонент на шаге 3
import Link from 'next/link';

const cinzel = Cinzel({ 
  subsets: ['latin'],
  variable: '--font-cinzel',
  weight: ['400', '700']
});

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'Эйдос — образ, форма, идея | Гипсовая лепнина',
  applicationName: 'Эйдос',
  description: 'Лепной декор ручной работы в Санкт-Петербурге. Индивидуальный подбор, изготовление, замер и монтаж.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${cinzel.variable} ${inter.variable} scroll-smooth`}>
      <body className="antialiased bg-[#f7f5f0] text-[#292b25] min-h-screen flex flex-col">
        <AOSInit /> {/* Инициализируем анимации */}
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <footer className="site-footer">
          <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end lg:px-12 lg:py-12">
            <div>
              <Link href="/" className="inline-flex items-center gap-3" aria-label="Эйдос — на главную">
                <span className="flex size-9 items-center justify-center rounded-full border border-white/20 text-[#d0b38b]">
                  <svg aria-hidden="true" viewBox="0 0 32 32" fill="none" className="size-5">
                    <path d="M5 26V15.5C5 9.7 9.7 5 15.5 5S26 9.7 26 15.5V26M3 26h26M10 26v-5h12v5M9 15h14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                  </svg>
                </span>
                <span>
                  <span className="block font-cinzel text-xs font-semibold tracking-[0.12em]">ЭЙДОС</span>
                  <span className="mt-1 block text-[9px] tracking-[0.06em] text-white/45">εἶδος · образ, форма, идея</span>
                </span>
              </Link>
              <p className="mt-4 max-w-md text-xs leading-5 text-white/50">Создаём детали, которые превращают интерьер в историю.</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] text-white/65 md:justify-end">
              <Link href="/#portfolio">Проекты</Link>
              <Link href="/#calculator">Каталог</Link>
              <Link href="/#contacts">Контакты</Link>
              <Link href="/admin">Вход для сотрудников</Link>
              <Link href="/debug">Диагностика</Link>
            </div>
            <p className="border-t border-white/10 pt-4 text-[10px] text-white/35 md:col-span-2">© 2026 Эйдос · Гипсовая лепнина ручной работы</p>
          </div>
        </footer>
      </body>
    </html>
  );
}