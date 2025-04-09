import {connectDB} from "~/server/api/database/MongoDB";
import {authorizeUser, getAccountByToken} from "~/server/api/interfaces/projects/Account";
import axios from "axios";
export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { username, password, apiPath } = body;
    try {
        await connectDB();
        const declaredToken = getCookie(event, 'sessionToken') || 'nullToken';
        const tokenUser = await getAccountByToken(declaredToken);
        if (tokenUser) {
            await sendToken(apiPath, declaredToken);
            return { status: 'OK' }
        }
        const dataStatus = checkData(username, password);
        if ((await dataStatus).status !== "OK") { return dataStatus }
        const user = await authorizeUser(username, password);
        if ((user.status === 'VERIFIED' || user.status === 'NOT_VERIFIED')) {
            setCookie(event, 'sessionToken', user.token)
            await sendToken(apiPath, user.token);
        }
        return { status: user.status };
    } catch (error) {
        console.log("Login error!", error)
        return { status: 'ERROR' };
    }
});

async function sendToken(apiPath: string, token: string) {
    if (apiPath.length > 5) {
        await axios.post(apiPath, {
            sessionToken: token
        }).catch(err => {
            console.error('Error on handshake with site:', err);
        })
    }
}

async function checkData(username: string, password: string): Promise<{status: string}> {
    if (!username) {
        return { status: 'EMPTY_USERNAME' };
    }
    if (username.length < 5) {
        return { status: 'SMALL_USERNAME' };
    }
    if (!password || password.length < 8) {
        return { status: 'SMALL_PASSWORD' };
    }
    return { status: 'OK' };
}
