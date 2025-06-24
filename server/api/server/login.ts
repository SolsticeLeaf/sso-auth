import { connectDB } from '~/server/api/database/MongoDB';
import { authorizeServerUser, hasUser } from '~/server/api/interfaces/Account';
import { hasToken } from '../interfaces/ServerToken';

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
    const authStatus = await authorizeServerUser(username, password);
    if (authStatus.status === 'VERIFIED' || authStatus.status === 'NOT_VERIFIED') {
      setResponseStatus(event, 200);
      return { status: 'OK' };
    } else {
      if (await hasUser(username)) {
        setResponseStatus(event, 401);
        return { status: 'WRONG_PASSWORD' };
      } else {
        setResponseStatus(event, 404);
        return { status: 'USER_NOT_FOUND' };
      }
    }
  } catch (error) {
    console.log('Server login error!', error);
    setResponseStatus(event, 500);
    return { status: 'ERROR' };
  }
});
