import { connectDB } from '~/server/api/database/MongoDB';
import { changeEmail } from '~/server/api/interfaces/Account';
import { getSessionUser } from '~/server/api/interfaces/Session';
import { connectRedis } from '~/server/api/database/Redis';
import { sendEmail } from './interfaces/EmailService';
import { addLog } from './interfaces/Logger';
const emailExpression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export default defineEventHandler(async (event) => {});
