// Конфигурация сайта и админки
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config.json');

export interface CompanyConfig {
  name: string;
  phone: string;
  email: string;
  description: string;
}

export interface AdminConfig {
  username: string;
  password: string;
}

export interface SiteConfig {
  admin: AdminConfig;
  company: CompanyConfig;
}

export function readConfig(): SiteConfig {
  try {
    const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading config:', error);
    return {
      admin: { username: 'admin', password: 'admin123' },
      company: {
        name: 'Античная лепнина',
        phone: '+7 (999) 123-45-67',
        email: 'info@ellada-decor.ru',
        description: '15 лет опыта, индивидуальные проекты, выезд на замер.'
      }
    };
  }
}

export function writeConfig(config: SiteConfig): void {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing config:', error);
    throw error;
  }
}

export function updateCompanyConfig(updates: Partial<CompanyConfig>): void {
  const config = readConfig();
  config.company = { ...config.company, ...updates };
  writeConfig(config);
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const config = readConfig();
  return config.admin.username === username && config.admin.password === password;
}