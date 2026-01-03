import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { EntityDocumentHelper } from '../../../../../../common/document-entity-helper';

export type AddressSchemaDocument = HydratedDocument<AddressSchemaClass>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    getters: true,
  },
})
export class AddressSchemaClass extends EntityDocumentHelper {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  phone: string;

  @Prop({ type: String, required: true })
  province: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: String, required: true })
  district: string;

  @Prop({ type: String, required: true })
  address: string;

  @Prop({ type: Boolean, default: false })
  isDefault: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  deletedAt?: Date;
}

export const AddressSchema = SchemaFactory.createForClass(AddressSchemaClass);

AddressSchema.index({ deletedAt: 1 });
