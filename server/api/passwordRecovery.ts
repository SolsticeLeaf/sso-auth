import { connectDB } from '~/server/api/database/MongoDB';
import { getAccountByEmail } from '~/server/api/interfaces/Account';
import { encodeBase64 } from '~/utilities/base64.utils';
import { sendEmail } from './interfaces/EmailService';
import { addLog } from './interfaces/Logger';
import { createCode } from './interfaces/RecoveryPasswordsCodes';
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
    if (account === undefined || account.emailStatus === 'VERIFIED') {
      return { status: 'OK' };
    }
    await addLog({
      userId: account._id,
      action: 'Password recovery request',
      additional: {
        userAgent: userAgent,
      },
    });
    const codeStatus = await createCode(account.username);
    if (codeStatus.status !== 'OK') {
      return { status: codeStatus.status };
    }
    const code = codeStatus.code;
    await sendEmail({
      from: `noreply`,
      to: email,
      subject: 'Verification link | SLEAF AUTH',
      text: `Your password recovery link is ${await createLink(routeData, account._id, code)} (Link period: 5 minutes)`,
      headers: { 'x-cloudmta-class': 'standard' },
    });
    return { status: 'OK' };
  } catch (error) {
    console.log('Login verify error!', error);
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
