import {connectDB} from "~/server/api/database/MongoDB";
import {getUserInfo} from "~/server/api/interfaces/projects/Account";
export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { token } = body;
    try {
        await connectDB();
        return await getUserInfo(token || getCookie(event, 'sessionToken'));
    } catch (error) {
        console.log("Login verify error!", error)
    }
});

