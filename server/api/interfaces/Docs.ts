import mongoose, { Schema, Document } from 'mongoose';

export interface Docs extends Document {
  _id: string;
  locales: object;
}

const schema: Schema = new Schema(
  {
    _id: { type: String },
    locales: { type: Object, required: true },
  },
  { collection: 'docs' }
);

const DocsModel = mongoose.model<Docs>('docs', schema);

export async function getDoc(id: string): Promise<Docs | undefined> {
  try {
    return (await DocsModel.find({ _id: id }))[0];
  } catch {
    return undefined;
  }
}
