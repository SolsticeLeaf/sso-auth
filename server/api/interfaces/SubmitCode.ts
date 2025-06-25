import mongoose, { Schema, Document } from 'mongoose';
import { randomUUID } from 'node:crypto';

export interface SubmitCode extends Document {
  userId: string;
  expires: Date;
}

const schema: Schema = new Schema(
  {
    _id: { type: String },
    userId: { type: String, required: true },
    expires: { type: Date, required: true },
  },
  { collection: 'submitCodes' }
);

const SubmitCodeModel = mongoose.model<SubmitCode>('submitCodes', schema);

export async function checkUserStatus(userId: string): Promise<{ status: string }> {
  try {
    const codes = await SubmitCodeModel.find({ userId: userId });
    for (const code of codes) {
      if (code.expires < new Date()) {
        await SubmitCodeModel.deleteOne({ _id: code._id }).exec();
      } else {
        return { status: 'HAS_CODE' };
      }
    }
  } catch (error) {
    console.error('Error on checking user code status:', error);
    return { status: 'ERROR' };
  }
  return { status: 'OK' };
}

export async function verifyCode(code: string): Promise<{ status: string; userId: string }> {
  try {
    const user = await SubmitCodeModel.findOneAndDelete({ _id: code });
    if (user) {
      let status = 'OK';
      if (user.expires < new Date()) {
        status = 'EXPIRED';
      }
      await SubmitCodeModel.findByIdAndDelete({ _id: code });
      return { status: status, userId: user.userId };
    }
  } catch (error) {
    console.error('Error on verify code:', error);
    return { status: 'ERROR', userId: '' };
  }
  return { status: 'NOT_FOUND', userId: '' };
}

export async function createCode(userId: string): Promise<{ status: string; code: string }> {
  try {
    const code = randomUUID().toString();
    const date = new Date();
    date.setMinutes(date.getMinutes() + 5);
    await SubmitCodeModel.create({
      _id: code,
      userId: userId,
      expires: date,
    });
    return { status: 'OK', code: code };
  } catch (error) {
    console.error('Error on code creation:', error);
    return { status: 'ERROR', code: '' };
  }
}
