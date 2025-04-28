import { connectDB } from '~/server/api/database/MongoDB';
import { getSessionUser } from '~/server/api/interfaces/Session';
import { connectRedis } from '~/server/api/database/Redis';
export default defineEventHandler(async (event) => {
  const userAgent = getRequestHeader(event, 'userAgent');
  if (userAgent === undefined) {
    return { status: 'NO_USER_AGENT', user: undefined };
  }
  try {
    await connectDB();
    await connectRedis();
    const sessionUser = await getSessionUser(event, userAgent);
    if (sessionUser) {
      return { status: 'OK', user: sessionUser };
    }
    return { status: 'NOT_FOUND', user: undefined };
  } catch (error) {
    console.log('Login verify error!', error);
    return { status: 'ERR', user: undefined };
  }
});
