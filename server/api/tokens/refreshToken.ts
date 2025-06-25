import { connectDB } from '~/server/api/database/MongoDB';
import { refreshUserToken } from '~/server/api/interfaces/Account';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { refreshToken } = body;
  const token = getRequestHeader(event, 'authorization');
  if (token === undefined) {
    return { status: 'ACCESS_DENIED', user: undefined };
  }
  const accessToken = token.replaceAll('Bearer ', '');
  try {
    await connectDB();
    return await refreshUserToken(accessToken, refreshToken);
  } catch (error) {
    console.error(`🔄❌ Error refreshing token with accessToken "${accessToken}" and refreshToken "${refreshToken}":`, error);
    return { status: 'ERROR', token: '' };
  }
});
