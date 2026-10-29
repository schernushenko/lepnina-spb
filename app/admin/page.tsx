'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AdminShell from './AdminShell';

interface Work {
  id: number;
  src: string;
  title: string;
  active: boolean;
}

interface CompanyConfig {
  name: string;
  phone: string;
  email: string;
  description: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [works, setWorks] = useState<Work[]>([]);
  const [config, setConfig] = useState<CompanyConfig>({
    name: '',
    phone: '',
    email: '',
    description: ''
  });
  
  const [newWork, setNewWork] = useState({
    title: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [workFormError, setWorkFormError] = useState('');
  const [isAddingWork, setIsAddingWork] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/config', { cache: 'no-store' });
      const data: { admin?: { username?: string } } = await response.json();

      if (response.ok && data.admin?.username) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.replace('/admin/login');
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      setIsAuthenticated(false);
      router.replace('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const loadWorks = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/works');
      if (response.ok) {
        const data = await response.json();
        setWorks(data);
      }
    } catch (error) {
      console.error('Error loading works:', error);
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.company);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkAuth();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const timeoutId = window.setTimeout(() => {
      void loadWorks();
      void loadConfig();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, loadWorks, loadConfig]);

  const handleAddWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWork.title || !selectedImage) {
      setWorkFormError('Укажите название работы и выберите изображение.');
      return;
    }

    setWorkFormError('');
    setIsAddingWork(true);
    try {
      const formData = new FormData();
      formData.set('title', newWork.title);
      formData.set('image', selectedImage);

      const response = await fetch('/api/admin/works', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setNewWork({ title: '' });
        setSelectedImage(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
        await loadWorks();
      } else {
        const data = await response.json();
        setWorkFormError(data.error || 'Не удалось добавить работу.');
      }
    } catch (error) {
      console.error('Error adding work:', error);
      setWorkFormError('Ошибка соединения при загрузке изображения.');
    } finally {
      setIsAddingWork(false);
    }
  };

  const handleToggleWork = async (work: Work) => {
    try {
      const response = await fetch('/api/admin/works', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...work, active: !work.active })
      });

      if (response.ok) {
        loadWorks();
      }
    } catch (error) {
      console.error('Error toggling work:', error);
    }
  };

  const handleDeleteWork = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту работу?')) return;

    try {
      const response = await fetch(`/api/admin/works?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadWorks();
      }
    } catch (error) {
      console.error('Error deleting work:', error);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: config })
      });

      if (response.ok) {
        alert('Настройки обновлены');
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="flex items-center gap-3 text-sm font-medium text-[#777971]">
          <span className="size-4 animate-spin rounded-full border-2 border-[#e3e3dc] border-t-[#a67b4e]" />
          Загружаем панель управления…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminShell
      active="dashboard"
      title="Обзор"
      description="Управляйте портфолио, контактами и настройками сайта в одном месте."
    >
      <main className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e9e9e5] bg-white p-5 shadow-[0_2px_8px_rgba(27,30,22,0.025)]">
            <p className="text-xs font-medium text-[#85877f]">Работ в портфолио</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#292b25]">{works.length}</p>
            <p className="mt-2 text-[11px] text-[#999b94]">{works.filter((work) => work.active).length} опубликовано на сайте</p>
          </div>
          <div className="rounded-2xl border border-[#e9e9e5] bg-white p-5 shadow-[0_2px_8px_rgba(27,30,22,0.025)]">
            <p className="text-xs font-medium text-[#85877f]">Состояние сайта</p>
            <div className="mt-3 flex items-center gap-2 text-lg font-semibold tracking-[-0.03em] text-[#292b25]">
              <span className="size-2 rounded-full bg-[#78a279]" />Всё работает
            </div>
            <p className="mt-2 text-[11px] text-[#999b94]">Изменения применяются сразу</p>
          </div>
          <Link href="/admin/calculator" className="group rounded-2xl border border-[#e9e9e5] bg-white p-5 shadow-[0_2px_8px_rgba(27,30,22,0.025)] transition-all hover:-translate-y-0.5 hover:border-[#d8d2c3] hover:shadow-md">
            <p className="text-xs font-medium text-[#85877f]">Калькулятор</p>
            <div className="mt-3 flex items-center justify-between text-lg font-semibold tracking-[-0.03em] text-[#292b25]">
              Каталог и заявки
              <span className="text-[#a67b4e] transition-transform group-hover:translate-x-1">→</span>
            </div>
            <p className="mt-2 text-[11px] text-[#999b94]">Настроить товары и цены</p>
          </Link>
        </section>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.8fr)]">
          <section id="portfolio" className="min-w-0 rounded-2xl border border-[#e9e9e5] bg-white p-5 shadow-[0_2px_8px_rgba(27,30,22,0.025)] sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.025em] text-[#292b25]">Портфолио</h2>
                <p className="mt-1 text-xs text-[#92948c]">Работы, которые видят посетители сайта</p>
              </div>
              <span className="rounded-full bg-[#f4f4f0] px-2.5 py-1 text-[11px] font-medium text-[#74766e]">{works.length} работ</span>
            </div>

            <form onSubmit={handleAddWork} className="mb-6 rounded-xl border border-dashed border-[#dcdcd5] bg-[#fafaf8] p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-white text-lg text-[#a67b4e] shadow-sm">+</span>
                <div>
                  <h3 className="text-sm font-semibold text-[#3a3c35]">Добавить новую работу</h3>
                  <p className="mt-0.5 text-[11px] text-[#999b94]">Загрузите фотографию проекта для портфолио</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <label className="block text-xs font-medium text-[#55574f]">
                  Название работы
                  <input
                    type="text"
                    value={newWork.title}
                    onChange={(e) => setNewWork({ ...newWork, title: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-[#e5e5df] bg-white px-3 py-2.5 text-sm font-normal text-[#34362f] outline-none transition focus:border-[#ae8a63] focus:ring-2 focus:ring-[#ae8a63]/15"
                    placeholder="Например, лепнина в гостиной"
                    required
                  />
                </label>
                <label className="block text-xs font-medium text-[#55574f]">
                  Фотография
                  <input
                    id="work-image"
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedImage(e.target.files?.[0] ?? null)}
                    className="mt-1.5 block w-full cursor-pointer rounded-lg border border-[#e5e5df] bg-white text-xs text-[#777971] file:mr-3 file:border-0 file:bg-[#f4f4f0] file:px-3 file:py-2.5 file:text-xs file:font-medium file:text-[#55574f]"
                    required
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] text-[#999b94]">До 20 МБ · изображение сохранится в портфолио</p>
                <button type="submit" disabled={isAddingWork} className="rounded-lg bg-[#292b25] px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#41443b] disabled:cursor-not-allowed disabled:opacity-50">
                  {isAddingWork ? 'Загружаем…' : 'Добавить работу'}
                </button>
              </div>
              {workFormError && <p className="mt-3 text-xs text-[#a14d3c]" role="alert">{workFormError}</p>}
            </form>

            <div className="space-y-2">
              {works.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#e5e5df] px-4 py-10 text-center">
                  <p className="text-sm font-medium text-[#64665e]">Пока нет работ</p>
                  <p className="mt-1 text-xs text-[#999b94]">Добавьте первую фотографию выше</p>
                </div>
              ) : works.map((work) => (
                <article key={work.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#efefec] p-3 transition-colors hover:bg-[#fcfcfa] sm:flex-nowrap">
                  <div className="size-[58px] shrink-0 overflow-hidden rounded-lg bg-[#f1f1ed]">
                    <Image src={work.src} alt={work.title} width={58} height={58} unoptimized className="size-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-medium text-[#383a35]">{work.title}</h4>
                    <p className="mt-0.5 truncate text-[11px] text-[#999b94]">{work.src}</p>
                    <span className={`mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-medium ${work.active ? 'text-[#5d855f]' : 'text-[#999b94]'}`}>
                      <span className={`size-1.5 rounded-full ${work.active ? 'bg-[#78a279]' : 'bg-[#b8b9b3]'}`} />
                      {work.active ? 'Опубликована' : 'Скрыта'}
                    </span>
                  </div>
                  <div className="ml-auto flex shrink-0 gap-2">
                    <button onClick={() => handleToggleWork(work)} className="rounded-lg border border-[#e9e9e5] px-3 py-2 text-[11px] font-medium text-[#65675f] transition-colors hover:bg-[#f4f4f0]">
                      {work.active ? 'Скрыть' : 'Опубликовать'}
                    </button>
                    <button onClick={() => handleDeleteWork(work.id)} className="rounded-lg px-2.5 py-2 text-[11px] font-medium text-[#a14d3c] transition-colors hover:bg-[#fbf2ef]">
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="settings" className="h-fit rounded-2xl border border-[#e9e9e5] bg-white p-5 shadow-[0_2px_8px_rgba(27,30,22,0.025)] sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold tracking-[-0.025em] text-[#292b25]">Данные компании</h2>
              <p className="mt-1 text-xs text-[#92948c]">Контактная информация и описание</p>
            </div>
            <form onSubmit={handleUpdateConfig} className="space-y-4">
              <label className="block text-xs font-medium text-[#55574f]">
                Название компании
                <input type="text" value={config.name} onChange={(e) => setConfig({ ...config, name: e.target.value })} className="mt-1.5 w-full rounded-lg border border-[#e5e5df] bg-white px-3 py-2.5 text-sm font-normal text-[#34362f] outline-none transition focus:border-[#ae8a63] focus:ring-2 focus:ring-[#ae8a63]/15" required />
              </label>
              <label className="block text-xs font-medium text-[#55574f]">
                Телефон
                <input type="tel" value={config.phone} onChange={(e) => setConfig({ ...config, phone: e.target.value })} className="mt-1.5 w-full rounded-lg border border-[#e5e5df] bg-white px-3 py-2.5 text-sm font-normal text-[#34362f] outline-none transition focus:border-[#ae8a63] focus:ring-2 focus:ring-[#ae8a63]/15" required />
              </label>
              <label className="block text-xs font-medium text-[#55574f]">
                Email
                <input type="email" value={config.email} onChange={(e) => setConfig({ ...config, email: e.target.value })} className="mt-1.5 w-full rounded-lg border border-[#e5e5df] bg-white px-3 py-2.5 text-sm font-normal text-[#34362f] outline-none transition focus:border-[#ae8a63] focus:ring-2 focus:ring-[#ae8a63]/15" required />
              </label>
              <label className="block text-xs font-medium text-[#55574f]">
                Описание
                <textarea value={config.description} onChange={(e) => setConfig({ ...config, description: e.target.value })} rows={4} className="mt-1.5 w-full resize-y rounded-lg border border-[#e5e5df] bg-white px-3 py-2.5 text-sm font-normal text-[#34362f] outline-none transition focus:border-[#ae8a63] focus:ring-2 focus:ring-[#ae8a63]/15" required />
              </label>
              <button type="submit" className="w-full rounded-lg bg-[#292b25] px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[#41443b] sm:w-auto">
                Сохранить изменения
              </button>
            </form>

            <div className="mt-7 border-t border-[#efefec] pt-5">
              <h3 className="text-xs font-semibold text-[#55574f]">Системная информация</h3>
              <div className="mt-3 space-y-2.5 text-[11px] text-[#85877f]">
                <p className="flex items-center justify-between gap-3"><span>Конфигурация</span><span className="font-medium text-[#5c5e56]">config.json</span></p>
                <p className="flex items-center justify-between gap-3"><span>Портфолио</span><span className="font-medium text-[#5c5e56]">works.json</span></p>
                <p className="flex items-center justify-between gap-3"><span>Публикация</span><span className="font-medium text-[#5d855f]">Мгновенно</span></p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AdminShell>
  );
}