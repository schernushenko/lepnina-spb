// Прямой тест API маршрутов
const BASE_URL = 'http://localhost:3000';

async function testAPIDirect() {
  console.log('🔍 Прямое тестирование API маршрутов...\n');

  const endpoints = [
    '/api/admin/works',
    '/api/admin/config',
    '/api/admin/login',
    '/admin',
    '/admin/login'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Тестируем: ${endpoint}`);
      const response = await fetch(`${BASE_URL}${endpoint}`);
      
      console.log(`  Status: ${response.status}`);
      console.log(`  OK: ${response.ok}`);
      console.log(`  Content-Type: ${response.headers.get('content-type')}`);
      
      const text = await response.text();
      console.log(`  Длина ответа: ${text.length} символов`);
      
      // Проверяем, что это не HTML страница
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        console.log(`  ❌ Возвращает HTML вместо JSON/данных`);
      } else if (text.length < 100) {
        console.log(`  Ответ: ${text.substring(0, 50)}...`);
      }
      
      console.log();
      
    } catch (error) {
      console.log(`  ❌ Ошибка: ${error.message}`);
      console.log();
    }
  }
}

// Запускаем тест
testAPIDirect();