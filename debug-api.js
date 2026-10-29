// Скрипт для отладки API маршрутов
console.log('🔍 Начинаем отладку API маршрутов...');

// Проверяем базовые маршруты
const endpoints = [
  '/api/test',
  '/api/admin/works/simple', 
  '/api/admin/works',
  '/api/admin/config',
  '/api/admin/login',
  '/admin',
  '/admin/login'
];

async function testEndpoint(url) {
  try {
    console.log(`\n📡 Тестируем: ${url}`);
    const response = await fetch(url);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   OK: ${response.ok}`);
    
    const contentType = response.headers.get('content-type');
    console.log(`   Content-Type: ${contentType || 'не указан'}`);
    
    const text = await response.text();
    console.log(`   Длина ответа: ${text.length} символов`);
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        console.log(`   ✅ Это JSON!`);
        console.log(`   Данные:`, JSON.stringify(json).substring(0, 200) + '...');
      } catch (e) {
        console.log(`   ❌ Невалидный JSON: ${e.message}`);
      }
    } else if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      console.log(`   ❌ Это HTML страница`);
      console.log(`   Тип страницы: ${text.includes('404') ? '404 Not Found' : 'Другая HTML страница'}`);
    } else {
      console.log(`   📄 Текст ответа: ${text.substring(0, 200)}...`);
    }
    
    return { url, ok: response.ok, contentType, isHtml: text.includes('<!DOCTYPE') };
    
  } catch (error) {
    console.log(`   ❌ Ошибка fetch: ${error.message}`);
    return { url, error: error.message };
  }
}

// Запускаем тесты последовательно
async function runTests() {
  console.log('='.repeat(50));
  console.log('🚀 Запуск тестов API маршрутов');
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Итоги тестирования:');
  console.log('='.repeat(50));
  
  const workingAPIs = results.filter(r => r.contentType && r.contentType.includes('application/json'));
  const htmlResponses = results.filter(r => r.isHtml);
  const errors = results.filter(r => r.error);
  
  console.log(`✅ Рабочих API: ${workingAPIs.length}`);
  workingAPIs.forEach(api => console.log(`   - ${api.url}`));
  
  console.log(`❌ HTML ответов: ${htmlResponses.length}`);
  htmlResponses.forEach(api => console.log(`   - ${api.url}`));
  
  console.log(`⚠️  Ошибок: ${errors.length}`);
  errors.forEach(api => console.log(`   - ${api.url}: ${api.error}`));
  
  console.log('\n' + '='.repeat(50));
  console.log('💡 Рекомендации:');
  console.log('='.repeat(50));
  
  if (workingAPIs.length === 0) {
    console.log('1. Next.js не видит API маршруты в папке app/api/');
    console.log('2. Проверьте структуру папок и файлов');
    console.log('3. Убедитесь, что файлы route.ts экспортируют функции GET/POST');
  } else {
    console.log('1. Некоторые API работают, некоторые - нет');
    console.log('2. Проверьте конкретные маршруты, которые возвращают HTML');
  }
}

// Запускаем тесты
runTests();