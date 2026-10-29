'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    title: '',
    src: ''
  });

  // Проверка авторизации при загрузке
  useEffect(() => {
    checkAuth();
  }, []);

  // Загрузка данных
  useEffect(() => {
    if (isAuthenticated) {
      loadWorks();
      loadConfig();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push('/admin/login');
      }
    } catch (error) {
      setIsAuthenticated(false);
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorks = async () => {
    try {
      const response = await fetch('/api/admin/works');
      if (response.ok) {
        const data = await response.json();
        setWorks(data);
      }
    } catch (error) {
      console.error('Error loading works:', error);
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.company);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAuthenticated(false);
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAddWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWork.title || !newWork.src) return;

    try {
      const response = await fetch('/api/admin/works', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWork)
      });

      if (response.ok) {
        setNewWork({ title: '', src: '' });
        loadWorks();
      }
    } catch (error) {
      console.error('Error adding work:', error);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Админ-панель</h1>
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900"
              >
                На сайт
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левая колонка: Управление работами */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Управление работами</h2>
            
            {/* Форма добавления новой работы */}
            <form onSubmit={handleAddWork} className="mb-8">
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название работы
                  </label>
                  <input
                    type="text"
                    value={newWork.title}
                    onChange={(e) => setNewWork({ ...newWork, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: Лепнина в гостиной"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Путь к изображению
                  </label>
                  <input
                    type="text"
                    value={newWork.src}
                    onChange={(e) => setNewWork({ ...newWork, src: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Например: /new-work.jpg"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Загрузите изображение в папку public и укажите путь
                  </p>
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Добавить работу
              </button>
            </form>

            {/* Список работ */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Список работ ({works.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {works.map((work) => (
                  <div
                    key={work.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={work.src}
                          alt={work.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{work.title}</h4>
                        <p className="text-sm text-gray-500">{work.src}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          work.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {work.active ? 'Активна' : 'Скрыта'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleToggleWork(work)}
                        className={`px-3 py-1 text-sm rounded ${
                          work.active
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {work.active ? 'Скрыть' : 'Показать'}
                      </button>
                      <button
                        onClick={() => handleDeleteWork(work.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Правая колонка: Настройки компании */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Настройки компании</h2>
            
            <form onSubmit={handleUpdateConfig}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название компании
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={config.phone}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={config.email}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Сохранить настройки
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Информация о системе</h3>
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-sm text-gray-600">
                  • Логин и пароль хранятся в файле config.json<br/>
                  • Работы сохраняются в файле works.json<br/>
                  • Все изменения применяются мгновенно<br/>
                  • Для изменения учетных данных отредактируйте config.json
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}