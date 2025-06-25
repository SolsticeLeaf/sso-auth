import fs from 'fs';
import path from 'path';

const productionMode = (process.env.NODE_ENV || 'production') === 'production';

const getProjectRoot = () => {
  if (productionMode) {
    return '/nuxt';
  }
  return process.cwd();
};

const getTranslationPath = (locale: string) => {
  const root = getProjectRoot();
  return path.join(root, 'i18n', 'locales', `${locale}.json`);
};

let translations: Record<string, Record<string, string>> = {};
try {
  translations = {
    en: JSON.parse(fs.readFileSync(getTranslationPath('en-US'), 'utf-8')),
    ru: JSON.parse(fs.readFileSync(getTranslationPath('ru-RU'), 'utf-8')),
  };
} catch (error) {
  console.error('🌍❌ Error loading translation files:', error);
}

async function renderEmailTemplate(templateName: string, data: any, locale: string = 'en'): Promise<{ html: string; subject: string }> {
  const templatePath = path.join(getProjectRoot(), 'templates/emails', `${templateName}.html`);
  let template;
  try {
    template = fs.readFileSync(templatePath, 'utf-8');
  } catch (error) {
    console.error(`📄❌ Error reading email template: ${templatePath}`, error);
    throw new Error(`Could not read email template: ${templateName}`);
  }
  const t = (key: string) => {
    const translation = translations[locale]?.[key];
    if (!translation) {
      console.warn(`🌍❓ Translation not found for key "${key}" in locale "${locale}". Falling back.`);
      return translations['en']?.[key] || key;
    }
    return translation;
  };
  let html = template.replace(/\{\{t\s+"([^"]+)"\}\}/g, (match, key) => t(key));
  Object.entries(data).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const subject = titleMatch ? titleMatch[1] : 'SLEAF AUTH';
  return { html, subject };
}

export async function sendTemplatedEmail(options: { to: string; template: string; data: any; locale?: string }) {
  const { sendEmail } = await import('../interfaces/EmailService');
  const { html, subject } = await renderEmailTemplate(options.template, options.data, options.locale);
  return sendEmail({
    from: 'noreply',
    to: options.to,
    subject,
    html,
    headers: { 'x-cloudmta-class': 'standard' },
  });
}
