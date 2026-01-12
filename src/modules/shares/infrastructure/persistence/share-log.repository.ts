import { ShareLog } from '../../domain/share-log';

export abstract class ShareLogRepository {
  abstract create(data: Omit<ShareLog, 'id' | 'createdAt'>): Promise<ShareLog>;

  abstract findByShareId(shareId: ShareLog['shareId']): Promise<ShareLog[]>;
}
