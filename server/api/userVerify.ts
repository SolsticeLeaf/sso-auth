import {connectDB} from "~/server/api/database/MongoDB";
import {getAccountByToken, updateEmailStatus} from "~/server/api/interfaces/projects/Account";
import {checkUserStatus, createCode, deleteUserCode, verifyCode} from "~/server/api/interfaces/projects/SubmitCode";
import nodemailer from 'nodemailer';
import {encodeBase64} from "~/utilities/base64.utils";

const domain = process.env.DOMAIN || 'https://auth.sleaf.dev';
const emailFrom = process.env.EMAIL_FROM || 'noreple@sleaf.dev';
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SMTP_SERVER || '',
    port: Number(process.env.EMAIL_SMTP_PORT?.toString() || "465"),
    secure: true,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_SMTP_USERNAME || '',
        pass: process.env.EMAIL_SMTP_PASSWORD || '',
    },
    logger: false
});

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { routeData } = body;
    try {
        await connectDB();
        const declaredToken = getCookie(event, 'sessionToken') || 'nullToken';
        const tokenUser = await getAccountByToken(declaredToken);
        if (tokenUser) {
            if (tokenUser.emailStatus === "VERIFIED") { return { status: 'OK' } }
            const code = routeData.submitCode;
            const username = tokenUser.username;
            const checkedCode = await checkSubmitCode(username, code);
            switch (checkedCode.status) {
                case 'OK':
                    await updateEmailStatus(tokenUser._id?.toString() || '', "VERIFIED");
                    return { status: 'OK' };
                case 'ERROR': return { status: 'ERROR' };
                case 'EXPIRED': return { status: 'EXPIRED' };
                default: return sendSubmitCode(username, tokenUser.email, routeData);
            }
        }
        return { status: 'TOKEN_NOT_FOUND' }
    } catch (error) {
        console.log("Login verify error!", error)
        return { status: 'ERROR' };
    }
});

async function checkSubmitCode(username: string, code: string): Promise<{ status: string }> {
    return await verifyCode(code, username);
}

async function sendSubmitCode(username: string, email: string, data: any): Promise<{ status: string }> {
    const checkCodeStatus = (await checkUserStatus(username)).status;
    if (checkCodeStatus === 'HAS_CODE') { return { status: 'ALREADY_SENT' };
    } else if (checkCodeStatus === 'ERROR') { return { status: 'ERROR' }; }
    const codeStatus = await createCode(username);
    if (codeStatus.status !== 'OK') { return { status: codeStatus.status }; }
    const code = codeStatus.code;
    try {
        await transporter.sendMail({
            from: `"SLEAF AUTH" <${emailFrom}>`,
            to: email,
            subject: "Verification link | SLEAF AUTH",
            text: `Your verification link is ${await createLink(data, code)} (Link period: 5 minutes)`,
            headers: { 'x-cloudmta-class': 'standard' }
        });
        return { status: 'CODE_SENT' };
    } catch (error) {
        await deleteUserCode(code, username);
        return { status: 'CODE_NOT_SENT' };
    }
}

async function createLink(data: any, code: string): Promise<string> {
    const routeData = encodeBase64(JSON.stringify({
        locale: data.locale,
        theme: data.theme,
        returnUrl: data.returnUrl,
        apiPath: data.apiPath,
        submitCode: code
    }));
    return `${domain}/login/emailVerify?data=${routeData}`;
}



