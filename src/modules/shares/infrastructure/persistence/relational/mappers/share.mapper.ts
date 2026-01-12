import { Share, ShareTargetType, SharePlatform } from '../../../../domain/share';
import { ShareEntity } from '../entities/share.entity';

export class ShareMapper {
  static toDomain(raw: ShareEntity): Share {
    const domainEntity = new Share();
    domainEntity.id = raw.id;
    domainEntity.userId = raw.userId;
    domainEntity.shareCode = raw.shareCode;
    domainEntity.targetType = raw.targetType as ShareTargetType;
    domainEntity.targetId = raw.targetId;
    domainEntity.platform = raw.platform as SharePlatform;
    domainEntity.title = raw.title;
    domainEntity.description = raw.description ?? undefined;
    domainEntity.image = raw.image ?? undefined;
    domainEntity.url = raw.url;
    domainEntity.metadata = raw.metadata ?? undefined;
    domainEntity.viewCount = raw.viewCount;
    domainEntity.clickCount = raw.clickCount;
    domainEntity.conversionCount = raw.conversionCount;
    domainEntity.expiresAt = raw.expiresAt ?? undefined;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: Omit<Share, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): ShareEntity {
    const persistenceEntity = new ShareEntity();
    persistenceEntity.userId = Number(domainEntity.userId);
    persistenceEntity.shareCode = domainEntity.shareCode;
    persistenceEntity.targetType = domainEntity.targetType;
    persistenceEntity.targetId = domainEntity.targetId;
    persistenceEntity.platform = domainEntity.platform;
    persistenceEntity.title = domainEntity.title;
    persistenceEntity.description = domainEntity.description ?? null;
    persistenceEntity.image = domainEntity.image ?? null;
    persistenceEntity.url = domainEntity.url;
    persistenceEntity.metadata = domainEntity.metadata ?? null;
    persistenceEntity.viewCount = domainEntity.viewCount;
    persistenceEntity.clickCount = domainEntity.clickCount;
    persistenceEntity.conversionCount = domainEntity.conversionCount;
    persistenceEntity.expiresAt = domainEntity.expiresAt ?? null;
    return persistenceEntity;
  }
}
