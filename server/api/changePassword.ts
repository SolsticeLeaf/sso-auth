import { connectDB } from '~/server/api/database/MongoDB';
import { verifyCode } from './interfaces/RecoveryPasswordsCodes';
import { addLog } from './interfaces/Logger';
import { genSaltSync, hashSync } from 'bcrypt-ts';
import { getAccountEmail, updatePassword } from './interfaces/Account';
import { sendTemplatedEmail } from './utilities/emailTemplate';

const passwordLatinOnly: RegExp = /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]+$/;
const passwordHasUppercase: RegExp = /[A-Z]/;
const passwordHasLowercase: RegExp = /[a-z]/;
const passwordHasDigit: RegExp = /[0-9]/;
const passwordHasSpecialChar: RegExp = /\W|_/g;

const MAX_PASSWORD_LENGTH = 128;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { password, passwordRepeat, routeData } = body;
  if (!routeData || !routeData.submitCode || !routeData.userId) {
    console.error('Invalid route data:', { routeData });
    return { status: 'INVALID_DATA' };
  }
  const userAgent = getRequestHeader(event, 'userAgent');
  if (userAgent === undefined) {
    return { status: 'NO_USER_AGENT' };
  }
  try {
    await connectDB();
    const dataStatus = await checkData(password, passwordRepeat);
    if (dataStatus.status !== 'OK') {
      return dataStatus;
    }
    const code = routeData.submitCode;
    const userId = routeData.userId;
    const checkedCode = await verifyCode(code, userId);
    if (checkedCode.status === 'OK') {
      const hashedPassword = hashSync(password, genSaltSync(10));
      const updateResult = await updatePassword(userId, hashedPassword);
      if (updateResult.status === 'OK') {
        await addLog({
          userId: userId,
          action: 'Password changed',
          additional: {
            userAgent: userAgent,
            ip: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
          },
        });
        try {
          const email = await getAccountEmail(userId);
          if (email !== undefined) {
            await sendTemplatedEmail({
              to: email,
              subject: 'Password changed | SLEAF AUTH',
              template: 'password-change',
              data: {
                changeTime: new Date().toLocaleString(),
                userAgent,
                ipAddress: getRequestHeader(event, 'x-forwarded-for') || 'unknown',
              },
              locale: routeData.locale || 'en',
            });
          }
        } catch {}
        return { status: 'OK' };
      }
      return updateResult;
    } else if (checkedCode.status === 'EXPIRED') {
      return { status: 'TOKEN_EXPIRED' };
    } else if (checkedCode.status === 'NOT_FOUND') {
      return { status: 'TOKEN_NOT_FOUND' };
    }
    return { status: 'ERROR' };
  } catch (error) {
    console.error('Change password error:', {
      error,
      userId: routeData?.userId,
      userAgent,
    });
    return { status: 'ERROR' };
  }
});

async function checkData(password: string, passwordRepeat: string): Promise<{ status: string }> {
  if (!password) {
    return { status: 'EMPTY_PASSWORD' };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { status: 'PASSWORD_TOO_LONG' };
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
