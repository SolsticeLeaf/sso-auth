import { connectDB } from '~/server/api/database/MongoDB';
import { hasUser, registerServerUser } from '~/server/api/interfaces/Account';
import { hasToken } from '../interfaces/ServerToken';
const passwordHasUppercase: RegExp = /[A-Z]/;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password } = body;
  const token = getRequestHeader(event, 'authorization');
  try {
    await connectDB();
    if (!(await hasToken(token))) {
      setResponseStatus(event, 500);
      return { status: 'INVALID_TOKEN' };
    }
    if (!password || password.length < 8) {
      setResponseStatus(event, 406);
      return { status: 'SMALL_PASSWORD' };
    }
    if (!passwordHasUppercase.test(password)) {
      setResponseStatus(event, 407);
      return { status: 'PASSWORD_NO_UPPERCASE' };
    }
    if (await hasUser(username)) {
      setResponseStatus(event, 403);
      return { status: 'ALREADY_REGISTERED' };
    }
    const user = await registerServerUser(username, password);
    if (user.status === 'OK') {
      setResponseStatus(event, 200);
      return { status: 'OK' };
    }
    setResponseStatus(event, 500);
    return { status: user.status };
  } catch (error) {
    console.error(`🖥️📝❌ Server registration error for user "${username}":`, error);
    setResponseStatus(event, 500);
    return { status: 'ERROR' };
  }
});
