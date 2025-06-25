import { connectDB } from '~/server/api/database/MongoDB';
import { getAccountData } from '~/server/api/interfaces/Account';

export default defineEventHandler(async (event) => {
  const token = getRequestHeader(event, 'authorization');
  if (token === undefined) {
    return { status: 'ACCESS_DENIED', user: undefined };
  }
  const accessToken = token.replaceAll('Bearer ', '');
  try {
    await connectDB();
    return await getAccountData(accessToken);
  } catch (error) {
    console.error(`👤❌ Error getting user data for access token "${accessToken}":`, error);
    return { status: 'ERROR', code: '' };
  }
});
