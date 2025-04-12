import {connectDB} from "~/server/api/database/MongoDB";
import {refreshUserToken} from "~/server/api/interfaces/Account";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { accessToken, refreshToken } = body;
    try {
        await connectDB();
        return await refreshUserToken(accessToken, refreshToken);
    } catch (error) {
        console.log("Error on getting token!", error)
        return { status: 'ERROR', code: '' };
    }
});
