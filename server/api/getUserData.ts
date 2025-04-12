import {connectDB} from "~/server/api/database/MongoDB";
import {getAccountData} from "~/server/api/interfaces/Account";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { accessToken } = body;
    try {
        await connectDB();
        return await getAccountData(accessToken);
    } catch (error) {
        console.log("Error on getting token!", error)
        return { status: 'ERROR', code: '' };
    }
});
