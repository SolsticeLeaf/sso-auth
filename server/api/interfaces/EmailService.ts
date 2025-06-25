import nodemailer from 'nodemailer';

const debugMode = (process.env.NODE_ENV || 'production') === 'development';

export async function sendEmail(email: any) {
  if (debugMode) {
    console.log('Email: ', email);
  } else {
    try {
      return await nodemailer
        .createTransport({
          host: process.env.EMAIL_SMTP_SERVER || '',
          port: Number(process.env.EMAIL_SMTP_PORT?.toString() || '465'),
          secure: true,
          requireTLS: true,
          connectionTimeout: 8000,
          auth: {
            user: process.env.EMAIL_SMTP_USERNAME || '',
            pass: process.env.EMAIL_SMTP_PASSWORD || '',
          },
          logger: true,
          debug: false,
        })
        .sendMail(email);
    } catch (error) {
      console.error(`✉️❌ Error sending email to "${email.to}":`, error);
    }
  }
}
