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
    const doc = await DocsModel.findOne({ _id: id });
    if (doc) {
      return doc;
    }
  } catch (error) {
    console.error(`📚❌ Error finding document with id "${id}":`, error);
  }
  return undefined;
}
