import {connectDB} from "~/server/api/database/MongoDB";
import {getSessionUser} from "~/server/api/interfaces/Session";
import {connectRedis} from "~/server/api/database/Redis";
export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { userAgent } = body;
    try {
        await connectDB();
        await connectRedis();
        const sessionUser = await getSessionUser(event, userAgent);
        if (sessionUser) { return { status: 'OK', user: sessionUser }; }
        return { status: 'NOT_FOUND', user: undefined };
    } catch (error) {
        console.log("Login verify error!", error)
    }
});

