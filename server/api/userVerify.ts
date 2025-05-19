import { connectDB } from '~/server/api/database/MongoDB';
import { updateEmailStatus } from '~/server/api/interfaces/Account';
import { checkUserStatus, createCode, deleteUserCode, verifyCode } from '~/server/api/interfaces/SubmitCode';
import { encodeBase64 } from '~/utilities/base64.utils';
import { getSessionUser } from '~/server/api/interfaces/Session';
import { connectRedis } from '~/server/api/database/Redis';
import { sendTemplatedEmail } from './utilities/emailTemplate';

const domain = process.env.DOMAIN || 'https://auth.sleaf.dev';

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
        try {
          await sendTemplatedEmail({
            to: sessionUser.email,
            subject: 'Account authorization | SLEAF AUTH',
            template: 'email-change',
            data: {
              userAgent,
              changeTime: new Date().toLocaleString(),
            },
            locale: routeData.locale || 'en',
          });
        } catch {}
        return { status: 'OK' };
      }
      if (sessionUser.email.length === 0) {
        return { status: 'NO_EMAIL' };
      }
      const code = routeData.submitCode;
      const userId = sessionUser.userId;
      const checkedCode = await checkSubmitCode(userId, code);
      switch (checkedCode.status) {
        case 'OK':
          await updateEmailStatus(sessionUser.userId.toString(), 'VERIFIED');
          return { status: 'OK' };
        case 'ERROR':
          return { status: 'ERROR' };
        case 'EXPIRED':
          return { status: 'EXPIRED' };
        default:
          return sendSubmitCode(userId, sessionUser.email, routeData);
      }
    }
    return { status: 'TOKEN_NOT_FOUND' };
  } catch (error) {
    console.log('Login verify error!', error);
    return { status: 'ERROR' };
  }
});

async function checkSubmitCode(userId: string, code: string): Promise<{ status: string }> {
  return await verifyCode(code, userId);
}

async function sendSubmitCode(userId: string, email: string, data: any): Promise<{ status: string }> {
  const checkCodeStatus = (await checkUserStatus(userId)).status;
  if (checkCodeStatus === 'HAS_CODE') {
    return { status: 'ALREADY_SENT' };
  } else if (checkCodeStatus === 'ERROR') {
    return { status: 'ERROR' };
  }
  const codeStatus = await createCode(userId);
  if (codeStatus.status !== 'OK') {
    return { status: codeStatus.status };
  }
  const code = codeStatus.code;
  try {
    const verificationLink = await createLink(data, code);
    await sendTemplatedEmail({
      to: email,
      subject: 'Verification link | SLEAF AUTH',
      template: 'verification',
      data: {
        verificationLink,
      },
      locale: data.locale || 'en',
    });
    return { status: 'CODE_SENT' };
  } catch (error) {
    console.log('Error on sending code:', error);
    await deleteUserCode(code, userId);
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
