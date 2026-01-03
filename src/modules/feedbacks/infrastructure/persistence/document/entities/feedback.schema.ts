import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../../common/document-entity-helper';
import { FeedbackType, FeedbackStatus } from '../../../../domain/feedback';

export type FeedbackSchemaDocument = HydratedDocument<FeedbackSchemaClass>;

@Schema({
  collection: 'feedbacks',
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class FeedbackSchemaClass extends EntityDocumentHelper {
  @Prop({ type: Types.ObjectId, required: true, index: true, ref: 'UserSchemaClass' })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(FeedbackType), required: true, index: true })
  type: FeedbackType;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: String })
  contact?: string;

  @Prop({
    type: String,
    enum: Object.values(FeedbackStatus),
    default: FeedbackStatus.PENDING,
    index: true,
  })
  status: FeedbackStatus;

  @Prop({ type: String })
  reply?: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(FeedbackSchemaClass);
