import { connectDB } from '~/server/api/database/MongoDB';
import { changeEmail } from '~/server/api/interfaces/Account';
import { getSessionUser } from '~/server/api/interfaces/Session';
import { connectRedis } from '~/server/api/database/Redis';
import { sendTemplatedEmail } from './utilities/emailTemplate';

const emailExpression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email, routeData } = body;
  const userAgent = getRequestHeader(event, 'userAgent');
  if (userAgent === undefined) {
    return { status: 'NO_USER_AGENT', user: undefined };
  }
  try {
    await connectDB();
    await connectRedis();
    const sessionUser = await getSessionUser(event, userAgent);
    if (sessionUser) {
      if (email.length === 0) {
        return { status: 'NO_EMAIL' };
      }
      if (!emailExpression.test(email)) {
        return { status: 'INCORRECT_EMAIL' };
      }
      const oldEmail = sessionUser.email;
      await changeEmail(sessionUser.userId.toString(), email);
      try {
        await sendTemplatedEmail({
          to: oldEmail,
          subject: 'Email changed | SLEAF AUTH',
          template: 'email-change',
          data: {
            oldEmail,
            newEmail: email,
            changeTime: new Date().toLocaleString(),
            userAgent,
          },
          locale: routeData?.locale || 'en',
        });
      } catch {}
      return { status: 'OK' };
    }
    return { status: 'NOT_FOUND' };
  } catch (error) {
    console.log('Login verify error!', error);
    return { status: 'ERROR' };
  }
});
