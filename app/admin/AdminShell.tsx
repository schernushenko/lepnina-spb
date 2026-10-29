'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

type AdminShellProps = {
  active: 'dashboard' | 'calculator';
  title: string;
  description: string;
  children: ReactNode;
};

const navigation = [
  { id: 'dashboard', label: 'Обзор', href: '/admin', icon: 'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z' },
  { id: 'calculator', label: 'Калькулятор', href: '/admin/calculator', icon: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M8 8h.01 M12 8h.01 M16 8h.01 M8 12h.01 M12 12h.01 M16 12h.01 M8 16h.01 M12 16h.01 M16 16h.01' }
] as const;

function Icon({ path }: { path: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0">
      {path.split(' M').map((segment, index) => (
        <path key={index} d={`${index ? 'M' : ''}${segment}`} />
      ))}
    </svg>
  );
}

export default function AdminShell({ active, title, description, children }: AdminShellProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Не удалось завершить сеанс');
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="admin-shell min-h-screen bg-[#f7f7f5] text-[#20211f]">
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-[#e9e9e5] bg-white lg:flex">
        <Link href="/admin" className="flex h-[76px] items-center gap-3 border-b border-[#efefec] px-7">
          <span className="flex size-10 items-center justify-center rounded-xl bg-[#252820] text-white">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-5">
              <path d="M4 20V9l8-5 8 5v11M8 20v-6h8v6M2 20h20" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-[-0.03em]">Эллада.Декор</span>
            <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.16em] text-[#999b94]">Панель управления</span>
          </span>
        </Link>

        <div className="px-4 pt-8">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a3a49e]">Рабочее пространство</p>
          <nav aria-label="Главная навигация" className="space-y-1">
            {navigation.map((item) => {
              const isActive = item.id === active;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#f1f1ec] text-[#292b25]'
                      : 'text-[#777971] hover:bg-[#f7f7f4] hover:text-[#292b25]'
                  }`}
                >
                  <Icon path={item.icon} />
                  {item.label}
                  {isActive && <span className="ml-auto size-1.5 rounded-full bg-[#a67b4e]" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-[#efefec] p-4">
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#777971] transition-colors hover:bg-[#f7f7f4] hover:text-[#292b25]">
            <Icon path="M14 3h7v7 M10 14 21 3 M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            Открыть сайт
          </Link>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-[#777971] transition-colors hover:bg-[#fbf2ef] hover:text-[#a14d3c]">
            <Icon path="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
            Выйти из аккаунта
          </button>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f8f8f6] p-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-[#e8e7df] text-xs font-semibold text-[#57594f]">ЭД</span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-[#383a35]">Администратор</span>
              <span className="mt-0.5 block text-[10px] text-[#999b94]">Управление сайтом</span>
            </span>
            <span className="ml-auto size-2 rounded-full bg-[#78a279]" />
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-[252px]">
        <header className="admin-topbar sticky top-0 z-20 flex min-h-[76px] items-center justify-between border-b border-[#e9e9e5] bg-white/90 px-5 backdrop-blur-md sm:px-8 lg:px-10">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.13em] text-[#a0a19a]">
              <span className="lg:hidden">Эллада.Декор</span>
              <span className="hidden lg:inline">Рабочее пространство</span>
              <span>/</span>
              <span className="truncate text-[#72746d]">{active === 'dashboard' ? 'Обзор' : 'Калькулятор'}</span>
            </div>
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#292b25] sm:text-base">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-[#e9e9e5] px-3 py-1.5 text-[11px] font-medium text-[#777971] sm:flex">
              <span className="size-1.5 rounded-full bg-[#78a279]" />
              Сайт активен
            </span>
            <Link href="/" className="rounded-lg border border-[#e9e9e5] px-3 py-2 text-xs font-medium text-[#5b5d56] transition-colors hover:bg-[#f7f7f4]">
              На сайт
            </Link>
            <button type="button" onClick={handleLogout} className="rounded-lg bg-[#292b25] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#41443b] lg:hidden">
              Выйти
            </button>
          </div>
        </header>

        <div className="admin-page-content px-4 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-9">
          <div className="mb-7 max-w-3xl">
            <p className="text-sm leading-6 text-[#85877f]">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
