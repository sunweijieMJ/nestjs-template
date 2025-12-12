import { Feedback } from '../../../../domain/feedback';
import { FeedbackEntity } from '../entities/feedback.entity';

export class FeedbackMapper {
  static toDomain(entity: FeedbackEntity): Feedback {
    const domain = new Feedback();
    domain.id = entity.id;
    domain.userId = entity.userId;
    domain.type = entity.type;
    domain.content = entity.content;
    domain.images = entity.images;
    domain.contact = entity.contact;
    domain.status = entity.status;
    domain.reply = entity.reply;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    return domain;
  }

  static toPersistence(domain: Partial<Feedback>): Partial<FeedbackEntity> {
    const entity: Partial<FeedbackEntity> = {};

    if (domain.id !== undefined) {
      entity.id = Number(domain.id);
    }
    if (domain.userId !== undefined) {
      entity.userId = Number(domain.userId);
    }
    if (domain.type !== undefined) {
      entity.type = domain.type;
    }
    if (domain.content !== undefined) {
      entity.content = domain.content;
    }
    if (domain.images !== undefined) {
      entity.images = domain.images;
    }
    if (domain.contact !== undefined) {
      entity.contact = domain.contact;
    }
    if (domain.status !== undefined) {
      entity.status = domain.status;
    }
    if (domain.reply !== undefined) {
      entity.reply = domain.reply;
    }

    return entity;
  }
}
