import { EventHandlerRequest, H3Event } from 'h3';
import { encodeBase64 } from '~/utilities/base64.utils';
import { randomUUID } from 'node:crypto';
import { AccountData, getAccountById } from '~/server/api/interfaces/Account';
import { getValue, setValue, removeValue } from '~/server/api/database/Redis';

export async function getSessionUser(event: H3Event<EventHandlerRequest>, userAgent: string): Promise<AccountData | undefined> {
  try {
    const key = getCookie(event, 'sessionKey') || randomUUID().toString() + 'null';
    const session = await getValue(key);
    if (session !== null) {
      const json = JSON.parse(session);
      if (json && json.userAgent === userAgent) {
        const userId = json.userId;
        const account = await getAccountById(userId);
        if (account) {
          return {
            userId: userId,
            username: account.username,
            avatar: account.avatar,
            email: account.email,
            emailStatus: account.emailStatus,
            permissions: account.permissions,
          };
        }
      }
    }
  } catch (error) {
    console.error('Error on getting session:', error);
  }
  return undefined;
}

export async function saveSessionUser(event: H3Event<EventHandlerRequest>, userId: string, userAgent: string): Promise<void> {
  try {
    const key = encodeBase64(String(userId) + new Date() + randomUUID().toString());
    setCookie(event, 'sessionKey', key);
    await setValue(
      key,
      JSON.stringify({
        userId: userId,
        userAgent: userAgent,
      })
    );
  } catch (error) {
    console.error('Error on saving session:', error);
  }
}

export async function removeSession(event: H3Event<EventHandlerRequest>): Promise<void> {
  try {
    const key = getCookie(event, 'sessionKey') || null;
    deleteCookie(event, 'sessionKey');
    if (key) {
      await removeValue(key);
    }
  } catch (error) {
    console.error('Error on removing session:', error);
  }
}
