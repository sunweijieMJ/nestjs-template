import { ShareLog, ShareLogAction } from '../../../../domain/share-log';
import { ShareLogEntity } from '../entities/share-log.entity';

export class ShareLogMapper {
  static toDomain(raw: ShareLogEntity): ShareLog {
    const domainEntity = new ShareLog();
    domainEntity.id = raw.id;
    domainEntity.shareId = raw.shareId;
    domainEntity.action = raw.action as ShareLogAction;
    domainEntity.visitorIp = raw.visitorIp ?? undefined;
    domainEntity.userAgent = raw.userAgent ?? undefined;
    domainEntity.platform = raw.platform ?? undefined;
    domainEntity.metadata = raw.metadata ?? undefined;
    domainEntity.createdAt = raw.createdAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: Omit<ShareLog, 'id' | 'createdAt'>): ShareLogEntity {
    const persistenceEntity = new ShareLogEntity();
    persistenceEntity.shareId = Number(domainEntity.shareId);
    persistenceEntity.action = domainEntity.action;
    persistenceEntity.visitorIp = domainEntity.visitorIp ?? null;
    persistenceEntity.userAgent = domainEntity.userAgent ?? null;
    persistenceEntity.platform = domainEntity.platform ?? null;
    persistenceEntity.metadata = domainEntity.metadata ?? null;
    return persistenceEntity;
  }
}
