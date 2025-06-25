import { removeSession } from '~/server/api/interfaces/Session';
import { connectRedis } from '~/server/api/database/Redis';
import { connectDB } from '~/server/api/database/MongoDB';

export default defineEventHandler(async (event) => {
  await connectDB();
  await connectRedis();
  await removeSession(event);
});
