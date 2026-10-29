// Проверка версии Next.js и конфигурации
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка конфигурации Next.js проекта...\n');

// Проверяем package.json
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  console.log('📦 Package.json:');
  console.log(`   Name: ${packageJson.name}`);
  console.log(`   Version: ${packageJson.version}`);
  console.log(`   Next.js: ${packageJson.dependencies?.next || 'не найден'}`);
  console.log(`   React: ${packageJson.dependencies?.react || 'не найден'}`);
  console.log();
}

// Проверяем структуру папок
console.log('📁 Структура проекта:');
const checkDir = (dir, indent = '   ') => {
  if (fs.existsSync(dir)) {
    const items = fs.readdirSync(dir);
    console.log(`${indent}${path.basename(dir)}/`);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      if (stat.isDirectory()) {
        checkDir(itemPath, indent + '   ');
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        console.log(`${indent}   📄 ${item}`);
      }
    });
  } else {
    console.log(`${indent}${path.basename(dir)}/ ❌ не существует`);
  }
};

checkDir(path.join(__dirname, 'app'));
console.log();

// Проверяем API маршруты
console.log('🔌 API маршруты:');
const apiDir = path.join(__dirname, 'app', 'api');
if (fs.existsSync(apiDir)) {
  const apiRoutes = [];
  
  function findRoutes(dir, basePath = '') {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);
      const routePath = basePath + '/' + item;
      
      if (stat.isDirectory()) {
        findRoutes(itemPath, routePath);
      } else if (item === 'route.ts' || item === 'route.tsx') {
        apiRoutes.push(basePath || '/');
      }
    });
  }
  
  findRoutes(apiDir);
  
  if (apiRoutes.length > 0) {
    apiRoutes.forEach(route => {
      console.log(`   ✅ ${route}`);
    });
  } else {
    console.log('   ❌ Нет файлов route.ts в папке app/api/');
  }
} else {
  console.log('   ❌ Папка app/api/ не существует');
}
console.log();

// Проверяем next.config.ts
const configPath = path.join(__dirname, 'next.config.ts');
if (fs.existsSync(configPath)) {
  console.log('⚙️  Next.config.ts: существует');
  const configContent = fs.readFileSync(configPath, 'utf-8');
  if (configContent.includes('experimental')) {
    console.log('   ⚠️  Содержит experimental настройки');
  }
} else {
  console.log('⚙️  Next.config.ts: ❌ не существует');
}
console.log();

console.log('💡 Рекомендации:');
console.log('1. Убедитесь, что Next.js 16.3.0 поддерживает API маршруты в app/api/');
console.log('2. Проверьте, нет ли синтаксических ошибок в файлах route.ts');
console.log('3. Попробуйте удалить папку .next и перезапустить сервер');
console.log('4. Проверьте консоль сервера на наличие ошибок компиляции');