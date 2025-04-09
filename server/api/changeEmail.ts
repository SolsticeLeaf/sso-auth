import {connectDB} from "~/server/api/database/MongoDB";
import {changeEmail, getAccountByToken} from "~/server/api/interfaces/projects/Account";
const emailExpression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { email } = body;
    try {
        await connectDB();
        const declaredToken = getCookie(event, 'sessionToken') || 'nullToken';
        const tokenUser = await getAccountByToken(declaredToken);
        if (tokenUser) {
            if (email.length === 0) { return { status: 'NO_EMAIL' } }
            if (!emailExpression.test(email)) { return { status: 'INCORRECT_EMAIL' }; }
            await changeEmail(tokenUser._id?.toString() || 'noUser', email);
            return { status: 'OK' }
        }
        return { status: 'NOT_FOUND' }
    } catch (error) {
        console.log("Login verify error!", error)
        return { status: 'ERROR' };
    }
});


