import { connectDB } from '~/server/api/database/MongoDB';
import { authorizeServerUser } from '~/server/api/interfaces/Account';
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
    if (authStatus.status === 'OK') {
      setResponseStatus(event, 200);
      return { status: 'OK' };
    }
    if (authStatus.status === 'WRONG_PASSWORD') {
      setResponseStatus(event, 401);
      return { status: 'WRONG_PASSWORD' };
    }
    if (authStatus.status === 'NOT_FOUND') {
      setResponseStatus(event, 404);
      return { status: 'USER_NOT_FOUND' };
    }
  } catch (error) {
    console.log('Server login error!', error);
    setResponseStatus(event, 500);
    return { status: 'ERROR' };
  }
});
