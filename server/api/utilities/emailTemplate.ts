import fs from 'fs';
import path from 'path';

const getProjectRoot = () => {
  const cwd = process.cwd();
  return cwd.includes('.output') ? path.resolve(cwd, '../../') : cwd;
};

const translations: Record<string, Record<string, string>> = {
  en: JSON.parse(fs.readFileSync(path.join(getProjectRoot(), 'i18n/locales/en-US.json'), 'utf-8')),
  ru: JSON.parse(fs.readFileSync(path.join(getProjectRoot(), 'i18n/locales/ru-RU.json'), 'utf-8')),
};

export async function renderEmailTemplate(templateName: string, data: any, locale: string = 'en'): Promise<string> {
  const templatePath = path.join(process.cwd(), 'server/api/templates/emails', `${templateName}.html`);
  const template = fs.readFileSync(templatePath, 'utf-8');
  const t = (key: string) => translations[locale]?.[key] || translations['en'][key] || key;
  let html = template.replace(/\{\{t\s+"([^"]+)"\}\}/g, (match, key) => t(key));
  Object.entries(data).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });

  return html;
}

export async function sendTemplatedEmail(options: { to: string; subject: string; template: string; data: any; locale?: string }) {
  const { sendEmail } = await import('../interfaces/EmailService');
  const html = await renderEmailTemplate(options.template, options.data, options.locale);

  return sendEmail({
    from: 'noreply',
    to: options.to,
    subject: options.subject,
    html,
    headers: { 'x-cloudmta-class': 'standard' },
  });
}
