import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../utils/document-entity-helper';
import { FavoriteTargetType } from '../../../../domain/favorite';

export type FavoriteSchemaDocument = HydratedDocument<FavoriteSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class FavoriteSchemaClass extends EntityDocumentHelper {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, enum: Object.values(FavoriteTargetType), index: true })
  targetType: FavoriteTargetType;

  @Prop({ type: String, required: true, index: true })
  targetId: string;

  @Prop({ type: String })
  title?: string;

  @Prop({ type: String })
  image?: string;

  @Prop({ type: String })
  extra?: string;

  @Prop()
  createdAt: Date;
}

export const FavoriteSchema = SchemaFactory.createForClass(FavoriteSchemaClass);

// Compound unique index
FavoriteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
