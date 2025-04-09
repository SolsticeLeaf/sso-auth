import mongoose, { Schema, Document } from 'mongoose';
import { genSaltSync, hashSync, compareSync } from "bcrypt-ts";
import jwt from 'jsonwebtoken';
import {randomUUID} from "node:crypto";
import {encodeBase64} from "~/utilities/base64.utils";

const JWT_SECRET = process.env.JWT_SECRET || 'dfsdsfv32rvsdcv2csc';

export interface Account extends Document {
    username: string;
    password: string;
    avatar: string;
    email: string;
    emailStatus: 'VERIFIED' | 'NOT_VERIFIED';
    tokens: Array<string>;
    permissions: Array<string>;
}

export interface AccountData {
    userId: string;
    username: string;
    avatar: string;
    email: string;
    emailStatus: 'VERIFIED' | 'NOT_VERIFIED';
    permissions: Array<string>;
}

const schema: Schema = new Schema({
    _id: { type: String },
    username: { type: String, required: true },
    password: { type: String, required: true },
    avatar: { type: String, required: true },
    email: { type: String, required: true },
    emailStatus: { type: String, required: true },
    tokens: { type: Array<any>, required: true },
    permissions: { type: Array<any>, required: true }
}, { collection: 'accounts' })

const AccountModel = mongoose.model<Account>('accounts', schema);

export async function authorizeUser(username: string, password: string): Promise<{ status: string, token: string }> {
    try {
        const user = await AccountModel.findOne({ username: username});
        if (user && compareSync(password, user.password)) {
            const token = await createToken();
            const tokens = user.tokens;
            tokens.push(token);
            await updateTokens(user, tokens);
            return { status: user.emailStatus, token: token };
        }
    } catch (error) {
        console.error("Error on user authorize:", error);
        return { status: 'ERROR', token: '' };
    }
    return { status: 'NOT_FOUND', token: '' };
}

export async function getUserInfo(token: string): Promise<{ status: string, data: AccountData | null }> {
    try {
        const user = await getAccountByToken(token);
        if (user) {
            try {
                jwt.verify(token, JWT_SECRET)
            } catch (error: any) {
                if (error?.name === 'TokenExpiredError') {
                    const tokens = user.tokens.filter(token => token !== token);
                    await updateTokens(user, tokens);
                    return { status: 'EXPIRED', data: null };
                }
            }
            return { status: 'OK', data: {
                    userId: user._id?.toString() || 'undefined',
                    username: user.username,
                    avatar: user.avatar,
                    email: user.email,
                    emailStatus: user.emailStatus,
                    permissions: user.permissions
                } };
        }
    } catch (error) {
        console.error("Error on getting user info:", error);
        return { status: 'ERROR', data: null };
    }
    return { status: 'NOT_FOUND', data: null };
}

export async function refreshToken(token: string): Promise<{ status: string, token: string }> {
    try {
        const user = await getAccountByToken(token);
        if (user) {
            try {
                jwt.verify(token, JWT_SECRET)
                const newToken = await createToken();
                const tokens =  user.tokens.filter(token => token !== token);
                tokens.push(newToken);
                await updateTokens(user, tokens);
                return { status: 'OK', token: token };
            } catch (error: any) {
                if (error?.name === 'TokenExpiredError') {
                    await updateTokens(user, user.tokens.filter(token => token !== token));
                    return { status: 'EXPIRED', token: '' };
                }
            }
        }

    } catch (error) {
        console.error("Error on refresh user token:", error);
        return { status: 'ERROR', token: '' };
    }
    return { status: 'NOT_FOUND', token: '' };
}

export async function registerUser(username: string, password: string, email: string): Promise<{ status: string, token: string }> {
    try {
        if ((await AccountModel.findOne({ username: username }))) {
            return { status: 'USERNAME_EXISTS', token: '' };
        }
        if ((await AccountModel.findOne({ email: email }))) {
            return { status: 'EMAIL_EXISTS', token: '' };
        }
        const hashedPassword = hashSync(password, genSaltSync(10));
        const token = await createToken();
        await AccountModel.create({
            _id: encodeBase64(randomUUID().toString() + Date.now().toString()),
            username: username,
            password: hashedPassword,
            avatar: 'https://ik.imagekit.io/kiinse/profile-default.svg',
            email: email,
            emailStatus: 'NOT_VERIFIED',
            tokens: [token],
            permissions: ['USER']
        });
        return { status: 'OK', token: token }
    } catch (error) {
        console.error("Error on user register:", error);
        return { status: 'ERROR', token: '' };
    }
}

export async function getAccountByToken(token: string): Promise<Account | undefined> {
    const users = (await AccountModel.find()).filter(user => user.tokens.includes(token));
    if (users && users.length > 0) { return users[0]; }
    return undefined;
}

export async function updateTokens(user: Account, tokens: Array<string>): Promise<void> {
    await AccountModel.findOneAndUpdate({ _id: user._id }, { tokens: tokens });
}

export async function updateEmailStatus(id: string, emailStatus: string): Promise<void> {
    await AccountModel.findOneAndUpdate({ _id: id }, { emailStatus: emailStatus });
}

export async function createToken(): Promise<string> {
    return jwt.sign({}, JWT_SECRET, { expiresIn: '8h' });
}
