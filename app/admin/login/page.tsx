'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/admin');
      } else {
        setError(data.error || 'Ошибка входа');
      }
    } catch {
      setError('Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login flex min-h-screen bg-[#f7f7f5] text-[#292b25]">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-[#272a23] p-12 text-white lg:flex xl:p-16">
        <div className="absolute -right-36 -top-32 size-[520px] rounded-full border border-white/[0.07]" />
        <div className="absolute -right-20 -top-16 size-[390px] rounded-full border border-white/[0.07]" />
        <div className="absolute -bottom-48 -left-40 size-[520px] rounded-full border border-white/[0.07]" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-white/[0.09]">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6">
              <path d="M4 20V9l8-5 8 5v11M8 20v-6h8v6M2 20h20" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-[-0.02em]">Эллада.Декор</span>
        </div>
        <div className="relative max-w-lg">
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c2a987]">Пространство управления</p>
          <h1 className="text-4xl font-medium leading-[1.12] tracking-[-0.05em] xl:text-5xl">
            Красота<br />начинается<br />с деталей.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-6 text-white/55">
            Управляйте проектами, каталогом и обращениями клиентов в одном месте.
          </p>
        </div>
        <p className="relative text-[11px] text-white/35">© 2026 Эллада.Декор · Панель управления</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[390px]">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#292b25] text-white">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
                  <path d="M4 20V9l8-5 8 5v11M8 20v-6h8v6M2 20h20" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="text-sm font-semibold">Эллада.Декор</span>
            </div>
          </div>
          <div className="mb-7">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a67b4e]">Добро пожаловать</p>
            <h2 className="text-2xl font-semibold tracking-[-0.045em]">Вход в админ-панель</h2>
            <p className="mt-2 text-sm text-[#85877f]">Введите данные своей учётной записи</p>
          </div>

          <form className="space-y-5 rounded-2xl border border-[#e9e9e5] bg-white p-5 shadow-[0_8px_32px_rgba(27,30,22,0.045)] sm:p-7" onSubmit={handleSubmit}>
            <label htmlFor="username" className="block text-xs font-medium text-[#55574f]">
              Имя пользователя
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-[#e5e5df] bg-white px-3.5 py-3 text-sm text-[#34362f] outline-none transition placeholder:text-[#b2b3ad] focus:border-[#ae8a63] focus:ring-2 focus:ring-[#ae8a63]/15"
                placeholder="Введите имя пользователя"
              />
            </label>

            <label htmlFor="password" className="block text-xs font-medium text-[#55574f]">
              Пароль
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 block w-full rounded-lg border border-[#e5e5df] bg-white px-3.5 py-3 text-sm text-[#34362f] outline-none transition placeholder:text-[#b2b3ad] focus:border-[#ae8a63] focus:ring-2 focus:ring-[#ae8a63]/15"
                placeholder="Введите пароль"
              />
            </label>

            {error && (
              <p role="alert" className="rounded-lg border border-[#f0dfda] bg-[#fcf3f0] px-3.5 py-3 text-sm text-[#9b5548]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#292b25] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#41443b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ae8a63] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Проверяем…
                </>
              ) : 'Войти в систему'}
            </button>
            <p className="text-center text-[11px] leading-5 text-[#999b94]">
              Доступ только для авторизованных сотрудников
            </p>
          </form>

          <p className="mt-6 text-center text-[11px] text-[#a3a49e]">© 2026 Эллада.Декор</p>
        </div>
      </main>
    </div>
  );
}