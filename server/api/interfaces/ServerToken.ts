import mongoose, { Schema, Document } from 'mongoose';

export interface ServerToken extends Document {
  id: string;
}

const schema: Schema = new Schema(
  {
    _id: { type: String },
  },
  { collection: 'serverTokens' }
);

const ServerTokenModel = mongoose.model<ServerToken>('serverTokens', schema);

export async function hasToken(token: string | undefined): Promise<boolean> {
  try {
    if (token === undefined) return false;
    return (await ServerTokenModel.find({ _id: token.replace('Bearer ', '').trim() }).countDocuments()) > 0;
  } catch (error) {
    console.error('Error on check token:', error);
    return false;
  }
}
