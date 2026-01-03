import { Feedback } from '../../../../domain/feedback';
import { FeedbackSchemaClass } from '../entities/feedback.schema';

export class FeedbackMapper {
  static toDomain(schema: FeedbackSchemaClass): Feedback {
    const domain = new Feedback();
    domain.id = schema._id.toString();
    domain.userId = schema.userId.toString();
    domain.type = schema.type;
    domain.content = schema.content;
    domain.images = schema.images;
    domain.contact = schema.contact;
    domain.status = schema.status;
    domain.reply = schema.reply;
    domain.createdAt = schema.createdAt;
    domain.updatedAt = schema.updatedAt;
    return domain;
  }
}
