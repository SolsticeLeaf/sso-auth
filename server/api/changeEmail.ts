import {connectDB} from "~/server/api/database/MongoDB";
import {changeEmail} from "~/server/api/interfaces/Account";
import {getSessionUser} from "~/server/api/interfaces/Session";
import {connectRedis} from "~/server/api/database/Redis";
const emailExpression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { email, userAgent } = body;
    try {
        await connectDB();
        await connectRedis();
        const sessionUser = await getSessionUser(event, userAgent);
        if (sessionUser) {
            if (email.length === 0) { return { status: 'NO_EMAIL' } }
            if (!emailExpression.test(email)) { return { status: 'INCORRECT_EMAIL' }; }
            await changeEmail(sessionUser.userId.toString(), email);
            return { status: 'OK' }
        }
        return { status: 'NOT_FOUND' }
    } catch (error) {
        console.log("Login verify error!", error)
        return { status: 'ERROR' };
    }
});


