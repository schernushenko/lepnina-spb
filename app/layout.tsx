import './globals.css';
import { Cinzel, Inter } from 'next/font/google';
import Navbar from './components/Navbar';

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
  title: 'Греческая лепнина | Античный декор',
  description: '15 лет опыта. Выезд на замер. Лепнина в античном и классическом стиле.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${cinzel.variable} ${inter.variable} scroll-smooth`}>
      <body className="antialiased bg-[#f3efe8] text-[#2c2a28] min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          {children}
        </main>
        <footer className="text-center py-4 text-[10px] text-[#b38b5d] tracking-widest border-t border-[#b38b5d]/20 bg-[#fcfbf9]">
          © 2026 • Ο ΔΙΑΚΟΣΜΗΤΙΚΟΣ (Античная студия декора)
        </footer>
      </body>
    </html>
  );
}