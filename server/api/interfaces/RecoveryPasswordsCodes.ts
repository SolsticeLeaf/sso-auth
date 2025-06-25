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
  { collection: 'recoverySubmitCodes' }
);

const SubmitCodeModel = mongoose.model<SubmitCode>('recoverySubmitCodes', schema);

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
    console.error(`❌ Error checking user's recovery code status for user ${userId}:`, error);
    return { status: 'ERROR' };
  }
  return { status: 'OK' };
}

export async function verifyCode(code: string, userId: string): Promise<{ status: string }> {
  try {
    const user = await SubmitCodeModel.findOneAndDelete({ _id: code, userId: userId });
    if (user) {
      if (user.expires < new Date()) {
        return { status: 'EXPIRED' };
      }
      return { status: 'OK' };
    }
  } catch (error) {
    console.error(`❌ Error verifying recovery code for user ${userId}:`, error);
    return { status: 'ERROR' };
  }
  return { status: 'NOT_FOUND' };
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
    console.error(`❌ Error creating new recovery code for user ${userId}:`, error);
    return { status: 'ERROR', code: '' };
  }
}
