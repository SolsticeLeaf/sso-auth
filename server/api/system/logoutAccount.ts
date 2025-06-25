import { removeSession } from '~/server/api/interfaces/Session';
import { connectRedis } from '~/server/api/database/Redis';
import { connectDB } from '~/server/api/database/MongoDB';

export default defineEventHandler(async (event) => {
  const userAgent = getRequestHeader(event, 'userAgent');
  try {
    await connectDB();
    await connectRedis();
    await removeSession(event);
  } catch (error) {
    console.error(`🪵❌ Error logging out for user agent "${userAgent}":`, error);
  }
});
