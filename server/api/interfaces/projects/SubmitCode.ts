import mongoose, { Schema, Document } from 'mongoose';
import {randomUUID} from "node:crypto";

export interface SubmitCode extends Document {
    username: string;
    expires: Date;
}

const schema: Schema = new Schema({
    _id: { type: String },
    username: { type: String, required: true },
    expires: { type: Date, required: true }
}, { collection: 'submitCodes' })

const SubmitCodeModel = mongoose.model<SubmitCode>('submitCodes', schema);

export async function checkUserStatus(username: string): Promise<{ status: string }> {
    try {
        const codes = await SubmitCodeModel.find({ username: username });
        for (const code of codes) {
            if (code.expires < new Date()) {
                await SubmitCodeModel.findOneAndDelete({ _id: code._id }).exec();
            } else {
                return { status: 'HAS_CODE' };
            }
        }
    } catch (error) {
        console.error("Error on checking user code status:", error);
        return { status: 'ERROR' };
    }
    return { status: 'OK' };
}

export async function deleteUserCode(code: string, username: string): Promise<void> {
    try {
        await SubmitCodeModel.findOneAndDelete({ _id: code, username: username }).exec();
    } catch (error) {
        console.error("Error on deleting user code:", error);
    }
}

export async function verifyCode(code: string, username: string): Promise<{ status: string }> {
    try {
        const user = await SubmitCodeModel.findOne({ _id: code, username: username });
        if (user) {
            let status = 'OK';
            if (user.expires < new Date()) { status = 'EXPIRED'; }
            await SubmitCodeModel.findByIdAndDelete({ _id: code, username: username })
            return { status: status };
        }
    } catch (error) {
        console.error("Error on verify code:", error);
        return { status: 'ERROR' };
    }
    return { status: 'NOT_FOUND' };
}

export async function createCode(username: string): Promise<{ status: string, code: string }>  {
    try {
        const code = randomUUID().toString();
        const date = new Date();
        date.setMinutes(date.getMinutes() + 5);
        await SubmitCodeModel.create({
            _id: code,
            username: username,
            expires: date,
        });
        return { status: 'OK', code: code };
    } catch (error) {
        console.error("Error on code creation:", error);
        return { status: 'ERROR', code: '' };
    }
}
