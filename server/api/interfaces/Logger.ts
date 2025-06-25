import { randomUUID } from 'node:crypto';
import mongoose, { Schema, Document } from 'mongoose';
import { encodeBase64 } from '~/utilities/base64.utils';

export interface LogData {
  userId: string;
  action: string;
  additional: Object;
}

export interface Log extends Document {
  userId: string;
  date: Date;
  action: string;
  additional: Object;
}

const schema: Schema = new Schema(
  {
    _id: { type: String },
    userId: { type: String, required: true },
    action: { type: String, required: true },
    date: { type: Date, required: true },
    additional: { type: Object, required: false },
  },
  { collection: 'logs' }
);

const LogModel = mongoose.model<Log>('logs', schema);

export async function addLog(data: LogData): Promise<void> {
  try {
    const date = new Date();
    await LogModel.create({
      _id: encodeBase64(`${randomUUID().toString()}${date}`),
      userId: data.userId,
      date: date,
      action: data.action,
      additional: data.additional,
    });
  } catch (error) {
    console.error(`📝❌ Error creating log for user "${data.userId}" with action "${data.action}":`, error);
  }
}
