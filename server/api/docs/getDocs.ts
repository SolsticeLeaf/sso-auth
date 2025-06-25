import { connectDB } from '../database/MongoDB';
import { getDoc } from '../interfaces/Docs';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { page } = body;
  try {
    await connectDB();
    const docs = await getDoc(page);
    if (docs === undefined) {
      return { status: 'NOT_FOUND', docs: {} };
    }
    return { status: 'OK', docs: docs };
  } catch (error) {
    console.error(`📚❌ Error getting doc for page "${page}":`, error);
    return { status: 'ERR', docs: {} };
  }
});
