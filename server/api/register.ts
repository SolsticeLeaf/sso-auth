import {connectDB} from "~/server/api/database/MongoDB";
import {registerUser} from "~/server/api/interfaces/Account";
import {saveSessionUser} from "~/server/api/interfaces/Session";
import {connectRedis} from "~/server/api/database/Redis";
import { Filter } from 'bad-words'
const filter = new Filter();
const emailExpression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const usernameExpression: RegExp = /^[A-Za-z][A-Za-z0-9]*$/;
const passwordLatinOnly: RegExp = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/;
const passwordHasUppercase: RegExp = /[A-Z]/;
const passwordHasLowercase: RegExp = /[a-z]/;
const passwordHasDigit: RegExp = /[0-9]/;
const passwordHasSpecialChar: RegExp = /[!@#$%^&*()_+\-=$begin:math:display$$end:math:display${};':"\\|,.<>\/?`~]/;

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { email, username, password, passwordRepeat } = body;
    const userAgent = getRequestHeader(event, 'userAgent');
    if (userAgent === undefined) { return { status: 'NO_USER_AGENT', user: undefined } }
    try {
        const dataStatus = checkData(email, username, password, passwordRepeat);
        if ((await dataStatus).status !== "OK") { return dataStatus }
        await connectDB();
        await connectRedis();
        const user = await registerUser(username, password, email);
        if (user.userId.length > 5) { await saveSessionUser(event, user.userId, userAgent); }
        return { status: user.status };
    } catch (error) {
        console.log("Register error!", error)
        return { status: 'ERROR' };
    }
});

async function checkData(email: string, username: string, password: string, passwordRepeat: string): Promise<{ status: string }> {
    if (!email) {
        return { status: 'EMPTY_EMAIL' };
    }
    if (!emailExpression.test(email)) {
        return { status: 'INCORRECT_EMAIL' };
    }
    if (!username) {
        return { status: 'EMPTY_USERNAME' };
    }
    if (!usernameExpression.test(username)) {
        return { status: 'USERNAME_MUST_BE_LATIN' };
    }
    if (filter.isProfane(username)) {
        return { status: 'BAD_WORD' };
    }
    if (username.length < 5) {
        return { status: 'SMALL_USERNAME' };
    }
    if (!password) {
        return { status: 'EMPTY_PASSWORD' };
    }
    if (password.length < 8) {
        return { status: 'SMALL_PASSWORD' };
    }
    if (!passwordLatinOnly.test(password)) {
        return { status: 'PASSWORD_ONLY_LATIN' };
    }
    if (!passwordHasUppercase.test(password)) {
        return { status: 'PASSWORD_NO_UPPERCASE' };
    }
    if (!passwordHasLowercase.test(password)) {
        return { status: 'PASSWORD_NO_LOWERCASE' };
    }
    if (!passwordHasDigit.test(password)) {
        return { status: 'PASSWORD_NO_DIGIT' };
    }
    if (!passwordHasSpecialChar.test(password)) {
        return { status: 'PASSWORD_NO_SPECIAL_CHAR' };
    }
    if (!passwordRepeat) {
        return { status: 'EMPTY_PASSWORD_REPEAT' };
    }
    if (password !== passwordRepeat) {
        return { status: 'PASSWORD_MISMATCH' };
    }
    return { status: 'OK' };
}
