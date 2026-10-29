'use client';

import { useState, useEffect } from 'react';

interface ApiTestResult {
  endpoint: string;
  status: string;
  data: unknown;
  error: string | null;
}

const endpoints = [
  '/api/ping',
  '/api/simple',
  '/api/health',
  '/api/test',
  '/api/admin/works/simple',
  '/api/admin/works',
  '/api/admin/config'
];

export default function TestApiPage() {
  const [results, setResults] = useState<ApiTestResult[]>([]);

  useEffect(() => {
    const testEndpoints = async () => {
      const newResults: ApiTestResult[] = [];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Testing: ${endpoint}`);
          const response = await fetch(endpoint);
          const contentType = response.headers.get('content-type');
          const text = await response.text();
          
          let data = null;
          let error = null;
          let status = 'unknown';
          
          if (contentType && contentType.includes('application/json')) {
            try {
              data = JSON.parse(text);
              status = 'json';
            } catch {
              error = 'Invalid JSON';
              status = 'error';
            }
          } else if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            error = 'HTML response (404 or other page)';
            status = 'html';
            data = text.substring(0, 100) + '...';
          } else {
            error = `Unexpected content-type: ${contentType}`;
            status = 'other';
            data = text.substring(0, 100) + '...';
          }
          
          newResults.push({
            endpoint,
            status,
            data,
            error
          });
          
        } catch (err) {
          newResults.push({
            endpoint,
            status: 'fetch-error',
            data: null,
            error: err instanceof Error ? err.message : String(err)
          });
        }
      }
      
      setResults(newResults);
    };
    
    testEndpoints();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Тестирование API маршрутов</h1>
      <p className="mb-6 text-gray-600">
        Эта страница проверяет доступность API маршрутов в Next.js 16.3.0
      </p>
      
      <div className="space-y-4">
        {results.map((result, index) => (
          <div 
            key={index} 
            className={`p-4 border rounded-lg ${
              result.status === 'json' ? 'border-green-200 bg-green-50' :
              result.status === 'html' ? 'border-red-200 bg-red-50' :
              'border-yellow-200 bg-yellow-50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-mono font-bold">{result.endpoint}</h3>
              <span className={`px-2 py-1 text-xs rounded ${
                result.status === 'json' ? 'bg-green-100 text-green-800' :
                result.status === 'html' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {result.status}
              </span>
            </div>
            
            {result.error ? (
              <div className="text-red-600 font-mono text-sm">{result.error}</div>
            ) : result.status === 'json' ? (
              <div className="font-mono text-sm bg-white p-2 rounded border">
                <pre>{JSON.stringify(result.data, null, 2)}</pre>
              </div>
            ) : (
              <div className="font-mono text-sm text-gray-600">
                {typeof result.data === 'string' ? result.data : 'No data'}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-2">Интерпретация результатов:</h3>
        <ul className="list-disc pl-5 text-blue-700 space-y-1">
          <li><span className="font-mono">json</span> - API работает корректно</li>
          <li><span className="font-mono">html</span> - Next.js возвращает HTML страницу (404 или другую)</li>
          <li><span className="font-mono">other</span> - Неожиданный тип контента</li>
          <li><span className="font-mono">fetch-error</span> - Ошибка при выполнении запроса</li>
        </ul>
      </div>
    </div>
  );
}