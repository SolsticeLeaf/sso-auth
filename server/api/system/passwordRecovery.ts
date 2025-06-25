import { connectDB } from '~/server/api/database/MongoDB';
import { getAccountByEmail } from '~/server/api/interfaces/Account';
import { encodeBase64 } from '~/utilities/base64.utils';
import { sendTemplatedEmail } from '../utilities/emailTemplate';
import { addLog } from '../interfaces/Logger';
import { createCode } from '../interfaces/RecoveryPasswordsCodes';

const emailExpression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const domain = process.env.DOMAIN || 'https://auth.sleaf.dev';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, routeData } = body;
  try {
    const userAgent = getRequestHeader(event, 'userAgent');
    if (userAgent === undefined) {
      return { status: 'NO_USER_AGENT', user: undefined };
    }
    if (email.length === 0) {
      return { status: 'NO_EMAIL' };
    }
    if (!emailExpression.test(email)) {
      return { status: 'INCORRECT_EMAIL' };
    }
    await connectDB();
    const account = await getAccountByEmail(email);
    if (account === undefined) {
      return { status: 'INCORRECT_EMAIL' };
    }
    if (account.emailStatus !== 'VERIFIED') {
      return { status: 'OK' };
    }
    await addLog({
      userId: account._id,
      action: 'Password recovery request',
      additional: {
        userAgent: userAgent,
      },
    });
    const codeStatus = await createCode(account._id);
    if (codeStatus.status !== 'OK') {
      return { status: codeStatus.status };
    }
    const code = codeStatus.code;
    const recoveryLink = await createLink(routeData, account._id, code);
    try {
      await sendTemplatedEmail({
        to: email,
        template: 'password-recovery',
        data: {
          recoveryLink,
        },
        locale: routeData.locale || 'en',
      });
    } catch (e) {
      console.error(`📧❌ Error sending password recovery email to "${email}":`, e);
      return { status: 'ERROR' };
    }
    return { status: 'OK' };
  } catch (error) {
    console.error(`🔑❌ Error during password recovery process for email "${email}":`, error);
    return { status: 'ERROR' };
  }
});

async function createLink(data: any, userId: string, code: string): Promise<string> {
  const routeData = encodeBase64(
    JSON.stringify({
      locale: data.locale,
      theme: data.theme,
      redirectUrl: data.redirectUrl,
      userId: userId,
      submitCode: code,
      clientId: data.clientId,
    })
  );
  return `${domain}/account/changePassword?data=${routeData}`;
}
