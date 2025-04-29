import nodemailer from 'nodemailer';

export async function sendEmail(email: any) {
  return nodemailer
    .createTransport({
      host: process.env.EMAIL_SMTP_SERVER || '',
      port: Number(process.env.EMAIL_SMTP_PORT?.toString() || '465'),
      secure: true,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_SMTP_USERNAME || '',
        pass: process.env.EMAIL_SMTP_PASSWORD || '',
      },
      logger: true,
      debug: false,
    })
    .sendMail(email);
}
