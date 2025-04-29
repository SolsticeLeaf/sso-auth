import { connectDB } from '~/server/api/database/MongoDB';
import { changeEmail } from '~/server/api/interfaces/Account';
import { getSessionUser } from '~/server/api/interfaces/Session';
import { connectRedis } from '~/server/api/database/Redis';
import { sendEmail } from './interfaces/EmailService';
const emailExpression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email } = body;
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
      await changeEmail(sessionUser.userId.toString(), email);
      try {
        await sendEmail({
          from: `noreply`,
          to: sessionUser.email,
          subject: 'Email changed| SLEAF AUTH',
          text: `Your email has been changed to: ${email}. Agent: ${userAgent} | Time: ${new Date()}`,
          headers: { 'x-cloudmta-class': 'standard' },
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
