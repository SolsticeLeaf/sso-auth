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

const translations: Record<string, Record<string, string>> = {
  en: JSON.parse(fs.readFileSync(getTranslationPath('en-US'), 'utf-8')),
  ru: JSON.parse(fs.readFileSync(getTranslationPath('ru-RU'), 'utf-8')),
};

async function renderEmailTemplate(templateName: string, data: any, locale: string = 'en'): Promise<string> {
  const templatePath = path.join(getProjectRoot(), 'templates/emails', `${templateName}.html`);
  const template = fs.readFileSync(templatePath, 'utf-8');
  const t = (key: string) => translations[locale]?.[key] || translations['en'][key] || key;
  let html = template.replace(/\{\{t\s+"([^"]+)"\}\}/g, (match, key) => t(key));
  Object.entries(data).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });

  return html;
}

export async function sendTemplatedEmail(options: { to: string; template: string; data: any; locale?: string }) {
  const { sendEmail } = await import('../interfaces/EmailService');
  const html = await renderEmailTemplate(options.template, options.data, options.locale);
  const t = (key: string) => translations[options.locale || 'en']?.[key] || translations['en'][key] || key;
  const subject = t(`${options.template}_title`);

  return sendEmail({
    from: 'noreply',
    to: options.to,
    subject,
    html,
    headers: { 'x-cloudmta-class': 'standard' },
  });
}
