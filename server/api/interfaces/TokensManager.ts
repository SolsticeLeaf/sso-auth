import mongoose, { Schema, Document } from 'mongoose';
import { Token } from '~/server/api/interfaces/Account';
import { randomUUID } from 'node:crypto';

export interface TokensManager extends Document {
  _id: string;
  clientId: string;
  token: Token;
}

const schema: Schema = new Schema(
  {
    _id: { type: String },
    clientId: { type: String, required: true },
    token: { type: Object, required: true },
  },
  { collection: 'tokensManager' }
);

const TokensManagerModel = mongoose.model<TokensManager>('tokensManager', schema);

export async function saveTokenRequest(token: Token, clientId: string): Promise<string | undefined> {
  try {
    const code = randomUUID().toString();
    await TokensManagerModel.create({
      _id: code,
      clientId: clientId,
      token: token,
    });
    return code;
  } catch (error) {
    console.error(`🎟️❌ Error on saving token request for client "${clientId}":`, error);
    return undefined;
  }
}

export async function getTokenRequest(code: string, clientId: string): Promise<Token | undefined> {
  try {
    const token = await TokensManagerModel.findOneAndDelete({ _id: code, clientId: clientId });
    return token?.token;
  } catch (error) {
    console.error(`🎟️❌ Error on getting token request for client "${clientId}" with code "${code}":`, error);
    return undefined;
  }
}
