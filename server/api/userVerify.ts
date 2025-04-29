import { connectDB } from '~/server/api/database/MongoDB';
import { updateEmailStatus } from '~/server/api/interfaces/Account';
import { checkUserStatus, createCode, deleteUserCode, verifyCode } from '~/server/api/interfaces/SubmitCode';
import nodemailer from 'nodemailer';
import { encodeBase64 } from '~/utilities/base64.utils';
import { getSessionUser } from '~/server/api/interfaces/Session';
import { connectRedis } from '~/server/api/database/Redis';

const domain = process.env.DOMAIN || 'https://auth.sleaf.dev';
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_SERVER || '',
  port: Number(process.env.EMAIL_SMTP_PORT?.toString() || '465'),
  secure: true,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_SMTP_USERNAME || '',
    pass: process.env.EMAIL_SMTP_PASSWORD || '',
  },
  logger: false,
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { routeData } = body;
  const userAgent = getRequestHeader(event, 'userAgent');
  if (userAgent === undefined) {
    return { status: 'NO_USER_AGENT', user: undefined };
  }
  try {
    await connectDB();
    await connectRedis();
    const sessionUser = await getSessionUser(event, userAgent);
    if (sessionUser) {
      if (sessionUser.emailStatus === 'VERIFIED') {
        return { status: 'OK' };
      }
      if (sessionUser.email.length === 0) {
        return { status: 'NO_EMAIL' };
      }
      const code = routeData.submitCode;
      const username = sessionUser.username;
      const checkedCode = await checkSubmitCode(username, code);
      switch (checkedCode.status) {
        case 'OK':
          await updateEmailStatus(sessionUser.userId.toString(), 'VERIFIED');
          return { status: 'OK' };
        case 'ERROR':
          return { status: 'ERROR' };
        case 'EXPIRED':
          return { status: 'EXPIRED' };
        default:
          return sendSubmitCode(username, sessionUser.email, routeData);
      }
    }
    return { status: 'TOKEN_NOT_FOUND' };
  } catch (error) {
    console.log('Login verify error!', error);
    return { status: 'ERROR' };
  }
});

async function checkSubmitCode(username: string, code: string): Promise<{ status: string }> {
  return await verifyCode(code, username);
}

async function sendSubmitCode(username: string, email: string, data: any): Promise<{ status: string }> {
  const checkCodeStatus = (await checkUserStatus(username)).status;
  if (checkCodeStatus === 'HAS_CODE') {
    return { status: 'ALREADY_SENT' };
  } else if (checkCodeStatus === 'ERROR') {
    return { status: 'ERROR' };
  }
  const codeStatus = await createCode(username);
  if (codeStatus.status !== 'OK') {
    return { status: codeStatus.status };
  }
  const code = codeStatus.code;
  try {
    await transporter.sendMail({
      from: `noreply`,
      to: email,
      subject: 'Verification link | SLEAF AUTH',
      text: `Your verification link is ${await createLink(data, code)} (Link period: 5 minutes)`,
      headers: { 'x-cloudmta-class': 'standard' },
    });
    return { status: 'CODE_SENT' };
  } catch (error) {
    console.log('Error on sending code:', error);
    await deleteUserCode(code, username);
    return { status: 'CODE_NOT_SENT' };
  }
}

async function createLink(data: any, code: string): Promise<string> {
  const routeData = encodeBase64(
    JSON.stringify({
      locale: data.locale,
      theme: data.theme,
      redirectUrl: data.redirectUrl,
      submitCode: code,
      clientId: data.clientId,
    })
  );
  return `${domain}/login/emailVerify?data=${routeData}`;
}
