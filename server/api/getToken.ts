import {getTokenRequest} from "~/server/api/interfaces/TokensManager";
import {connectDB} from "~/server/api/database/MongoDB";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { serviceCode, clientId } = body;
    try {
        await connectDB();
        return { token: await getTokenRequest(serviceCode, clientId)}
    } catch (error) {
        console.log("Error on getting token!", error)
        return { status: 'ERROR', code: '' };
    }
});
