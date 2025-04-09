import {connectDB} from "~/server/api/database/MongoDB";
import {registerUser} from "~/server/api/interfaces/projects/Account";
const emailExpression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { email, username, password, passwordRepeat } = body;
    try {
        const dataStatus = checkData(email, username, password, passwordRepeat);
        if ((await dataStatus).status !== "OK") { return dataStatus }
        await connectDB();
        const user = await registerUser(username, password, email);
        setCookie(event, 'sessionToken', user.token)
        return { status: user.status };
    } catch (error) {
        console.log("Register error!", error)
        return { status: 'ERROR' };
    }
});

async function checkData(email: string, username: string, password: string, passwordRepeat: string): Promise<{status: string}> {
    if (!email) {
        return { status: 'EMPTY_EMAIL' };
    }
    if (!emailExpression.test(email)) {
        return { status: 'INCORRECT_EMAIL' };
    }
    if (!username) {
        return { status: 'EMPTY_USERNAME' };
    }
    if (username.length < 5) {
        return { status: 'SMALL_USERNAME' };
    }
    if (!password || password.length < 8) {
        return { status: 'SMALL_PASSWORD' };
    }
    if (!passwordRepeat) {
        return { status: 'EMPTY_PASSWORD_REPEAT' };
    }
    if (password !== passwordRepeat) {
        return { status: 'PASSWORD_MISMATCH' };
    }
    return { status: 'OK' };
}
