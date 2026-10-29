'use client';

import { useState } from 'react';

interface ApiTestResult {
  url: string;
  type: string;
  status: number;
  ok: boolean;
  responseTime: number;
  contentType: string | null;
  isJson: boolean;
  isHtml: boolean;
  data: unknown;
  error: string | null;
  textLength: number;
}

export default function DebugPage() {
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const endpoints = [
    // Старые API (pages/api)
    { url: '/api/old-style', type: 'pages' },
    { url: '/api/admin/works', type: 'pages' },
    { url: '/api/admin/config', type: 'pages' },
    
    // Новые API (app/api) - простые
    { url: '/api/hello', type: 'app' },
    { url: '/api/ping', type: 'app' },
    { url: '/api/simple', type: 'app' },
    { url: '/api/health', type: 'app' },
    { url: '/api/test', type: 'app' },
    
    // Новые API (app/api) - админские
    { url: '/api/admin/works/simple', type: 'app' },
    { url: '/api/admin/works', type: 'app' },
    { url: '/api/admin/config', type: 'app' },
    { url: '/api/admin/login', type: 'app' },
  ];

  const testEndpoint = async (endpoint: { url: string; type: string }) => {
    try {
      console.log(`Testing ${endpoint.type} API: ${endpoint.url}`);
      const startTime = Date.now();
      const response = await fetch(endpoint.url);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      let data = null;
      let error = null;
      let isJson = false;
      let isHtml = false;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = JSON.parse(text);
          isJson = true;
        } catch {
          error = 'Invalid JSON';
        }
      } else if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        isHtml = true;
        error = 'HTML response';
        data = text.substring(0, 200) + '...';
      } else {
        error = `Unexpected content-type: ${contentType}`;
        data = text.substring(0, 200) + '...';
      }
      
      return {
        url: endpoint.url,
        type: endpoint.type,
        status: response.status,
        ok: response.ok,
        responseTime,
        contentType,
        isJson,
        isHtml,
        data,
        error,
        textLength: text.length
      };
      
    } catch (err) {
      return {
        url: endpoint.url,
        type: endpoint.type,
        status: 0,
        ok: false,
        responseTime: 0,
        contentType: null,
        isJson: false,
        isHtml: false,
        data: null,
        error: err instanceof Error ? err.message : String(err),
        textLength: 0
      };
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);
    
    const newResults: ApiTestResult[] = [];
    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint);
      newResults.push(result);
      setResults([...newResults]); // Обновляем по мере выполнения
    }
    
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Отладка API маршрутов Next.js 16.3.0</h1>
      
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-bold text-blue-800 mb-2">Информация о проекте:</h2>
        <ul className="list-disc pl-5 text-blue-700 space-y-1">
          <li>Next.js 16.3.0 (очень старая версия)</li>
          <li>Проверяем поддержку app/api и pages/api</li>
          <li>Синие маркеры - pages/api (старый стиль)</li>
          <li>Зеленые маркеры - app/api (новый стиль)</li>
        </ul>
      </div>
      
      <button
        onClick={runAllTests}
        disabled={loading}
        className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Тестируем...' : 'Запустить тесты API'}
      </button>
      
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-bold text-green-800">✅ Рабочие API</h3>
              <div className="text-2xl font-bold mt-2 text-green-600">
                {results.filter(r => r.isJson).length}
              </div>
            </div>
            
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-bold text-red-800">❌ HTML ответы</h3>
              <div className="text-2xl font-bold mt-2 text-red-600">
                {results.filter(r => r.isHtml).length}
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-bold text-yellow-800">⚠️ Ошибки</h3>
              <div className="text-2xl font-bold mt-2 text-yellow-600">
                {results.filter(r => r.error && !r.isHtml).length}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {results.map((result, index) => (
              <div 
                key={index}
                className={`p-4 border rounded-lg ${
                  result.isJson ? 'border-green-200 bg-green-50' :
                  result.isHtml ? 'border-red-200 bg-red-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`inline-block px-2 py-1 text-xs rounded mr-2 ${
                      result.type === 'pages' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {result.type}
                    </span>
                    <code className="font-bold">{result.url}</code>
                  </div>
                  <div className="text-right">
                    <div className={`px-2 py-1 text-xs rounded ${
                      result.isJson ? 'bg-green-100 text-green-800' :
                      result.isHtml ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.isJson ? 'JSON' : result.isHtml ? 'HTML' : 'ERROR'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{result.responseTime}ms</div>
                  </div>
                </div>
                
                <div className="text-sm space-y-1">
                  <div>Status: {result.status} {result.ok ? '✅' : '❌'}</div>
                  <div>Content-Type: {result.contentType || 'не указан'}</div>
                  <div>Длина: {result.textLength} символов</div>
                  
                  {result.error && (
                    <div className="text-red-600 font-mono text-xs">{result.error}</div>
                  )}
                  
                  {result.isJson && result.data !== null && (
                    <div className="mt-2 font-mono text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                      <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  )}
                  
                  {result.isHtml && (
                    <div className="mt-2 font-mono text-xs text-gray-600 overflow-auto max-h-40">
                      {typeof result.data === 'string'
                        ? result.data
                        : JSON.stringify(result.data)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}