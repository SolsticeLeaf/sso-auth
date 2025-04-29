import { connectDB } from '../database/MongoDB';
import { getDoc } from '../interfaces/Docs';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { page } = body;
  try {
    await connectDB();
    return { data: (await getDoc(page)) || {} };
  } catch (error) {
    return { data: {} };
  }
});
