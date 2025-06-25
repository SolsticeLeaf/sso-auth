import { connectDB } from '~/server/api/database/MongoDB';
import { updateEmailStatus } from '~/server/api/interfaces/Account';
import { checkUserStatus, createCode, verifyCode } from '~/server/api/interfaces/SubmitCode';
import { encodeBase64 } from '~/utilities/base64.utils';
import { getSessionUser } from '~/server/api/interfaces/Session';
import { connectRedis } from '~/server/api/database/Redis';
import { sendTemplatedEmail } from '../utilities/emailTemplate';

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
    const code = routeData.submitCode;
    if (code) {
      const checkedCode = await verifyCode(code);
      switch (checkedCode.status) {
        case 'OK':
          await updateEmailStatus(checkedCode.userId, 'VERIFIED');
          return { status: 'OK' };
        case 'ERROR':
          return { status: 'ERROR' };
        case 'EXPIRED':
          return { status: 'EXPIRED' };
        default:
          const sessionUser = await getSessionUser(event, userAgent);
          if (sessionUser) {
            if (sessionUser.emailStatus === 'VERIFIED') {
              return { status: 'OK' };
            }
            if (sessionUser.email.length === 0) {
              return { status: 'NO_EMAIL' };
            }
            const sessionUserId = sessionUser.userId;
            return sendSubmitCode(sessionUserId, sessionUser.email, routeData);
          }
      }
    }
    return { status: 'TOKEN_NOT_FOUND' };
  } catch (error) {
    console.log('Login verify error!', error);
    return { status: 'ERROR' };
  }
});

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
      template: 'verification',
      data: {
        verificationLink,
      },
      locale: data.locale || 'en',
    });
    return { status: 'CODE_SENT' };
  } catch (error) {
    console.log('Error on sending code:', error);
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
