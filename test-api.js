// Тестовый скрипт для проверки API
const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🔍 Тестирование API админ-панели...\n');

  try {
    // 1. Тест публичного доступа к работам
    console.log('1. Тестируем публичный доступ к работам:');
    const worksResponse = await fetch(`${BASE_URL}/api/admin/works`);
    console.log(`   Status: ${worksResponse.status}`);
    console.log(`   OK: ${worksResponse.ok}`);
    
    if (worksResponse.ok) {
      const worksData = await worksResponse.json();
      console.log(`   Количество работ: ${worksData.length}`);
    }
    console.log();

    // 2. Тест публичного доступа к конфигурации
    console.log('2. Тестируем публичный доступ к конфигурации:');
    const configResponse = await fetch(`${BASE_URL}/api/admin/config`);
    console.log(`   Status: ${configResponse.status}`);
    console.log(`   OK: ${configResponse.ok}`);
    
    if (configResponse.ok) {
      const configData = await configResponse.json();
      console.log(`   Название компании: ${configData.company?.name || 'Нет данных'}`);
    }
    console.log();

    // 3. Тест авторизации с неверными данными
    console.log('3. Тестируем авторизацию с неверными данными:');
    const badLoginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'wrong', password: 'wrong' })
    });
    console.log(`   Status: ${badLoginResponse.status}`);
    console.log(`   OK: ${badLoginResponse.ok}`);
    console.log();

    // 4. Тест авторизации с правильными данными
    console.log('4. Тестируем авторизацию с правильными данными:');
    const goodLoginResponse = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    console.log(`   Status: ${goodLoginResponse.status}`);
    console.log(`   OK: ${goodLoginResponse.ok}`);
    
    let cookies = [];
    if (goodLoginResponse.ok) {
      const setCookieHeader = goodLoginResponse.headers.get('set-cookie');
      if (setCookieHeader) {
        cookies = setCookieHeader.split(';');
        console.log(`   Куки установлены: ${cookies[0] ? 'Да' : 'Нет'}`);
      }
    }
    console.log();

    console.log('✅ Тестирование завершено!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    console.log('\n⚠️  Убедитесь, что сервер запущен: npm run dev');
  }
}

// Запускаем тест
testAPI();