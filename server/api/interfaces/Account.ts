import mongoose, { Schema, Document } from 'mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcrypt-ts';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { encodeBase64 } from '~/utilities/base64.utils';

const JWT_SECRET = process.env.JWT_SECRET || 'dfsdsfv32rvsdcv2csc';
const defaultAvatar = 'https://s3.sleaf.dev/auth-service/profile-default.svg';

export interface Account extends Document {
  _id: string;
  username: string;
  password: string;
  avatar: string;
  email: string;
  emailStatus: 'VERIFIED' | 'NOT_VERIFIED';
  tokens: Array<Token>;
  permissions: Array<string>;
}

export interface Token {
  accessToken: string;
  refreshToken: string;
  accessExpire: Date;
  refreshExpire: Date;
}

export interface AccountData {
  userId: string;
  username: string;
  avatar: string;
  email: string;
  emailStatus: 'VERIFIED' | 'NOT_VERIFIED';
  permissions: Array<string>;
}

const schema: Schema = new Schema(
  {
    _id: { type: String },
    username: { type: String, required: true },
    password: { type: String, required: true },
    avatar: { type: String, required: true },
    email: { type: String, required: true },
    emailStatus: { type: String, required: true },
    tokens: { type: Array<Token>, required: true },
    permissions: { type: Array<any>, required: true },
  },
  { collection: 'accounts' }
);

const AccountModel = mongoose.model<Account>('accounts', schema);

export async function authorizeUser(username: string, password: string): Promise<{ status: string; userId: string; token: Token | undefined }> {
  try {
    const user = await AccountModel.findOne({ username: username });
    if (user && compareSync(password, user.password)) {
      const token = await createToken();
      const tokens = user.tokens;
      tokens.push(token);
      await updateTokens(user, tokens);
      return { status: user.emailStatus, userId: user._id, token: token };
    }
  } catch (error) {
    console.error(`🔑❌ Error authorizing user "${username}":`, error);
    return { status: 'ERROR', userId: '', token: undefined };
  }
  return { status: 'NOT_FOUND', userId: '', token: undefined };
}

export async function authorizeUserByEmail(email: string, password: string): Promise<{ status: string; userId: string; token: Token | undefined }> {
  try {
    const user = await AccountModel.findOne({ email: email });
    if (user && compareSync(password, user.password)) {
      const token = await createToken();
      const tokens = user.tokens;
      tokens.push(token);
      await updateTokens(user, tokens);
      return { status: user.emailStatus, userId: user._id, token: token };
    }
  } catch (error) {
    console.error(`📧🔑❌ Error authorizing user with email "${email}":`, error);
    return { status: 'ERROR', userId: '', token: undefined };
  }
  return { status: 'NOT_FOUND', userId: '', token: undefined };
}

export async function authorizeUserById(userId: string): Promise<{ status: string; token: Token | undefined }> {
  try {
    const user = await AccountModel.findOne({ _id: userId });
    if (user) {
      const token = await createToken();
      const tokens = user.tokens;
      tokens.push(token);
      await updateTokens(user, tokens);
      return { status: 'OK', token: token };
    }
  } catch (error) {
    console.error(`🆔🔑❌ Error authorizing user with id "${userId}":`, error);
    return { status: 'ERROR', token: undefined };
  }
  return { status: 'NOT_FOUND', token: undefined };
}

export async function registerUser(username: string, password: string, email: string): Promise<{ status: string; userId: string; token: Token | undefined }> {
  try {
    if (await AccountModel.findOne({ username: username })) {
      return { status: 'USERNAME_EXISTS', userId: '', token: undefined };
    }
    if (await AccountModel.findOne({ email: email })) {
      return { status: 'EMAIL_EXISTS', userId: '', token: undefined };
    }
    const hashedPassword = hashSync(password, genSaltSync(10));
    const token = await createToken();
    const userId = encodeBase64(randomUUID().toString() + Date.now().toString());
    await AccountModel.create({
      _id: userId,
      username: username,
      password: hashedPassword,
      avatar: defaultAvatar,
      email: email,
      emailStatus: 'NOT_VERIFIED',
      tokens: [token],
      permissions: ['USER'],
    });
    return { status: 'OK', userId: userId, token: token };
  } catch (error) {
    console.error(`📝❌ Error registering user "${username}":`, error);
    return { status: 'ERROR', userId: '', token: undefined };
  }
}

export async function authorizeServerUser(username: string, password: string): Promise<{ status: string }> {
  try {
    const user = await AccountModel.findOne({ username: username });
    if (user) {
      if (compareSync(password, user.password)) {
        return { status: 'OK' };
      } else {
        return { status: 'WRONG_PASSWORD' };
      }
    }
  } catch (error) {
    console.error(`🖥️🔑❌ Error authorizing server user "${username}":`, error);
    return { status: 'ERROR' };
  }
  return { status: 'NOT_FOUND' };
}

export async function registerServerUser(username: string, password: string): Promise<{ status: string }> {
  try {
    if (await AccountModel.findOne({ username: username })) {
      return { status: 'USERNAME_EXISTS' };
    }
    const hashedPassword = hashSync(password, genSaltSync(10));
    const userId = encodeBase64(randomUUID().toString() + Date.now().toString());
    await AccountModel.create({
      _id: userId,
      username: username,
      password: hashedPassword,
      avatar: defaultAvatar,
      email: 'empty',
      emailStatus: 'NOT_VERIFIED',
      tokens: [],
      permissions: ['USER'],
    });
    return { status: 'OK' };
  } catch (error) {
    console.error(`🖥️📝❌ Error registering server user "${username}":`, error);
    return { status: 'ERROR' };
  }
}

export async function refreshUserToken(accessToken: string, refreshToken: string): Promise<{ status: string; token: Token | undefined }> {
  try {
    const users = await AccountModel.find();
    for (const user of users) {
      const tokens = user.tokens.filter((token) => token.accessToken === accessToken && token.refreshToken === refreshToken);
      if (tokens && tokens.length > 0) {
        const newTokens = user.tokens.filter((token) => token.refreshToken !== refreshToken);
        if (!(await verifyToken(refreshToken))) {
          await updateTokens(user, newTokens);
          return { status: 'EXPIRED', token: undefined };
        } else {
          const newToken = await createToken();
          newTokens.push(newToken);
          await updateTokens(user, newTokens);
          return { status: 'OK', token: newToken };
        }
      }
    }
  } catch (error) {
    console.error(`🔄❌ Error on token refresh for an access token "${accessToken}":`, error);
    return { status: 'ERROR', token: undefined };
  }
  return { status: 'NOT_FOUND', token: undefined };
}

export async function getAccountData(accessToken: string): Promise<{ status: string; account: AccountData | undefined }> {
  try {
    const users = await AccountModel.find();
    for (const user of users) {
      const tokens = user.tokens.filter((token) => token.accessToken === accessToken);
      if (tokens && tokens.length > 0) {
        if (!(await verifyToken(accessToken))) {
          return { status: 'EXPIRED', account: undefined };
        }
        return {
          status: 'OK',
          account: {
            userId: user._id,
            username: user.username,
            avatar: user.avatar,
            email: user.email,
            emailStatus: user.emailStatus,
            permissions: user.permissions,
          },
        };
      }
    }
  } catch (error) {
    console.error(`👤❌ Error getting account for an access token "${accessToken}":`, error);
    return { status: 'ERROR', account: undefined };
  }
  return { status: 'NOT_FOUND', account: undefined };
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (error) {
    return false;
  }
}

export async function getAccountById(userId: string): Promise<Account | undefined> {
  try {
    const user = await AccountModel.findOne({ _id: userId });
    if (user) {
      return user;
    }
  } catch (e) {
    console.error(`👤❌ Error getting account by id "${userId}":`, e);
  }
  return undefined;
}

export async function hasUser(username: string): Promise<boolean> {
  try {
    const user = await AccountModel.findOne({ username: username });
    if (user) {
      return true;
    }
  } catch (error) {
    console.error(`❓👤 Error checking if user "${username}" exists:`, error);
  }
  return false;
}

export async function getAccountByEmail(email: string): Promise<Account | undefined> {
  try {
    const user = await AccountModel.findOne({ email: email });
    if (user) {
      return user;
    }
  } catch (error) {
    console.error(`📧👤❌ Error getting account by email "${email}":`, error);
  }
  return undefined;
}

export async function getAccountEmail(userId: string): Promise<string | undefined> {
  try {
    const user = await AccountModel.findOne({ _id: userId });
    if (user) {
      return user.email;
    }
  } catch (error) {
    console.error(`📧🆔❌ Error getting account email for user "${userId}":`, error);
  }
  return undefined;
}

async function updateTokens(user: Account, tokens: Array<Token>): Promise<void> {
  try {
    user.tokens = tokens;
    await AccountModel.updateOne({ _id: user._id }, { tokens: tokens });
  } catch (error) {
    console.error(`🔄🔑❌ Error updating tokens for user "${user._id}":`, error);
  }
}

export async function changeEmail(id: string, email: string): Promise<void> {
  try {
    await AccountModel.updateOne({ _id: id }, { email: email });
  } catch (error) {
    console.error(`📧🔄❌ Error changing email for user "${id}":`, error);
  }
}

export async function updateEmailStatus(id: string, emailStatus: string): Promise<void> {
  try {
    await AccountModel.updateOne({ _id: id }, { emailStatus: emailStatus });
  } catch (error) {
    console.error(`📧🚦❌ Error updating email status for user "${id}":`, error);
  }
}

async function createToken(): Promise<Token> {
  try {
    const accessExpire = new Date();
    accessExpire.setDate(accessExpire.getDate() + 1);
    const refreshExpire = new Date();
    refreshExpire.setDate(refreshExpire.getDate() + 30);
    const accessToken = jwt.sign({ type: 'access' }, JWT_SECRET, { expiresIn: '3d' });
    const refreshToken = jwt.sign({ type: 'refresh' }, JWT_SECRET, { expiresIn: '30d' });
    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
      accessExpire: accessExpire,
      refreshExpire: refreshExpire,
    };
  } catch (error) {
    console.error('✨🔑❌ Error creating token:', error);
    throw error;
  }
}

export async function updatePassword(id: string, hashedPassword: string): Promise<{ status: string }> {
  try {
    await AccountModel.updateOne({ _id: id }, { password: hashedPassword, tokens: [] });
    return { status: 'OK' };
  } catch (error) {
    console.error(`🔑🔄❌ Error updating password for user "${id}":`, error);
    return { status: 'ERROR' };
  }
}
