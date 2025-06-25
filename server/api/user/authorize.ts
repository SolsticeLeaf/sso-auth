import { connectDB } from '~/server/api/database/MongoDB';
import { authorizeUser, authorizeUserById, authorizeUserByEmail, Token, getAccountEmail } from '~/server/api/interfaces/Account';
import { getSessionUser, saveSessionUser } from '~/server/api/interfaces/Session';
import { connectRedis } from '~/server/api/database/Redis';
import { EventHandlerRequest, H3Event } from 'h3';
import { saveTokenRequest } from '~/server/api/interfaces/TokensManager';
import { addLog } from '../interfaces/Logger';
import { sendTemplatedEmail } from '../utilities/emailTemplate';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, password, isEmail, clientId, locale } = body;
  const userAgent = getRequestHeader(event, 'userAgent');
  if (userAgent === undefined) {
    return { status: 'NO_USER_AGENT', code: '' };
  }
  try {
    await connectDB();
    await connectRedis();
    const sessionAuth = await authBySession(event, clientId, userAgent, locale);
    if (sessionAuth.status === 'OK') {
      return sessionAuth;
    }
    const dataStatus = checkData(username, password);
    if ((await dataStatus).status !== 'OK') {
      return dataStatus;
    }
    if (isEmail) {
      return await authByEmail(event, username, password, clientId, userAgent, locale);
    }
    return await authByPassword(event, username, password, clientId, userAgent, locale);
  } catch (error) {
    console.log('Login error!', error);
    return { status: 'ERROR', code: '' };
  }
});

async function authBySession(
  event: H3Event<EventHandlerRequest>,
  clientId: string,
  userAgent: string,
  locale: string
): Promise<{ status: string; code: string }> {
  const sessionUser = await getSessionUser(event, userAgent);
  if (sessionUser) {
    const authStatus = await authorizeUserById(sessionUser.userId || 'undefined');
    if (authStatus.status === 'OK') {
      await addLog({
        userId: sessionUser.userId,
        action: 'AUTHORIZE',
        additional: {
          userAgent: userAgent,
          type: 'Session',
        },
      });
      return { status: 'OK', code: await saveToken(authStatus.token, clientId, sessionUser.email, userAgent, event, locale, false) };
    }
  }
  return { status: 'NOT_FOUND', code: '' };
}

async function authByPassword(
  event: H3Event<EventHandlerRequest>,
  username: string,
  password: string,
  clientId: string,
  userAgent: string,
  locale: string
): Promise<{ status: string; code: string }> {
  const authStatus = await authorizeUser(username, password);
  if (authStatus.status === 'VERIFIED' || authStatus.status === 'NOT_VERIFIED') {
    await saveSessionUser(event, authStatus.userId, userAgent);
    await addLog({
      userId: authStatus.userId,
      action: 'AUTHORIZE',
      additional: {
        userAgent: userAgent,
        type: 'Username',
      },
    });
    return { status: 'OK', code: await saveToken(authStatus.token, clientId, await getAccountEmail(authStatus.userId), userAgent, event, locale, true) };
  }
  return { status: authStatus.status, code: '' };
}

async function authByEmail(
  event: H3Event<EventHandlerRequest>,
  email: string,
  password: string,
  clientId: string,
  userAgent: string,
  locale: string
): Promise<{ status: string; code: string }> {
  const authStatus = await authorizeUserByEmail(email, password);
  if (authStatus.status === 'VERIFIED' || authStatus.status === 'NOT_VERIFIED') {
    await saveSessionUser(event, authStatus.userId, userAgent);
    await addLog({
      userId: authStatus.userId,
      action: 'AUTHORIZE',
      additional: {
        userAgent: userAgent,
        type: 'Email',
      },
    });
    return { status: 'OK', code: await saveToken(authStatus.token, clientId, email, userAgent, event, locale, true) };
  }
  return { status: authStatus.status, code: '' };
}

async function saveToken(
  token: Token | undefined,
  clientId: string,
  email: string | undefined,
  userAgent: string,
  event: H3Event<EventHandlerRequest>,
  locale: string,
  sendEmail: boolean
): Promise<string> {
  if (sendEmail && email !== undefined && email !== 'empty') {
    try {
      await sendTemplatedEmail({
        to: email,
        template: 'login-notification',
        data: {
          loginTime: new Date().toLocaleString(),
          userAgent,
          ipAddress: getRequestHeader(event, 'x-forwarded-for') || getRequestHeader(event, 'x-real-ip') || 'Unknown',
        },
        locale: locale,
      });
    } catch (error) {
      console.log('Error sending login notification:', error);
    }
  }
  if (!token) {
    return 'undefined';
  }
  return (await saveTokenRequest(token, clientId)) || 'undefined';
}

async function checkData(username: string, password: string): Promise<{ status: string; code: string }> {
  if (!username) {
    return { status: 'EMPTY_USERNAME', code: '' };
  }
  if (username.length < 5) {
    return { status: 'SMALL_USERNAME', code: '' };
  }
  if (!password || password.length < 8) {
    return { status: 'SMALL_PASSWORD', code: '' };
  }
  return { status: 'OK', code: '' };
}
