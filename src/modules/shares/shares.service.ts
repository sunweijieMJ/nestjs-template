import { Injectable, Logger, NotFoundException, GoneException } from '@nestjs/common';
import { CreateShareDto } from './dto/create-share.dto';
import { QueryShareDto } from './dto/query-share.dto';
import { ShareRepository } from './infrastructure/persistence/share.repository';
import { ShareLogRepository } from './infrastructure/persistence/share-log.repository';
import { Share } from './domain/share';
import { ShareLogAction } from './domain/share-log';
import { IPaginationOptions } from '../../common/types/pagination-options';
import { generateShareCode } from './utils/share-code.util';
import { isUniqueViolationOf } from '../../common/utils/exceptions.util';
import { ShareStatsDto } from './dto/share-stats.dto';

@Injectable()
export class SharesService {
  private readonly logger = new Logger(SharesService.name);

  constructor(
    private readonly shareRepository: ShareRepository,
    private readonly shareLogRepository: ShareLogRepository,
  ) {}

  async create(userId: number, createShareDto: CreateShareDto): Promise<Share> {
    this.logger.log(`Creating share for user: ${userId}`);

    // Generate unique share code with retry mechanism
    const maxAttempts = 5;

    for (let attempt = 1; ; attempt++) {
      const shareCode = generateShareCode();

      try {
        // Create share in database
        const share = await this.shareRepository.create({
          userId,
          shareCode,
          targetType: createShareDto.targetType,
          targetId: createShareDto.targetId,
          platform: createShareDto.platform,
          title: createShareDto.title,
          description: createShareDto.description,
          image: createShareDto.image,
          url: createShareDto.url,
          metadata: createShareDto.metadata,
          viewCount: 0,
          clickCount: 0,
          conversionCount: 0,
          expiresAt: createShareDto.expiresAt ? new Date(createShareDto.expiresAt) : undefined,
        });

        this.logger.log(`Share created with code: ${shareCode}`);
        return share;
      } catch (error: unknown) {
        if (attempt < maxAttempts && isUniqueViolationOf(error, 'UQ_share_shareCode')) {
          this.logger.warn(`ShareCode collision detected, retrying... (attempt ${attempt}/${maxAttempts})`);
          continue;
        }
        throw error;
      }
    }
  }

  async findManyWithPagination(
    userId: number,
    queryShareDto: QueryShareDto,
    paginationOptions: IPaginationOptions,
  ): Promise<Share[]> {
    return this.shareRepository.findManyWithPagination({
      userId,
      filterOptions: queryShareDto,
      paginationOptions,
    });
  }

  async findOne(id: number, userId: number): Promise<Share> {
    const share = await this.shareRepository.findByIdAndUserId(id, userId);

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    return share;
  }

  async findByShareCode(shareCode: string, visitorIp?: string, userAgent?: string): Promise<Share> {
    const share = await this.findActiveByShareCode(shareCode);

    // Increment view count and log the view
    await this.shareRepository.incrementViewCount(share.id);
    await this.shareLogRepository.create({
      shareId: share.id,
      action: ShareLogAction.VIEW,
      visitorIp,
      userAgent,
      platform: share.platform,
    });

    this.logger.log(`Share viewed: ${shareCode}`);
    return share;
  }

  async trackShare(
    shareCode: string,
    action: ShareLogAction,
    visitorIp?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const share = await this.findActiveByShareCode(shareCode);

    // Increment corresponding count
    if (action === ShareLogAction.CLICK) {
      await this.shareRepository.incrementClickCount(share.id);
    } else if (action === ShareLogAction.CONVERSION) {
      await this.shareRepository.incrementConversionCount(share.id);
    }

    // Log the action
    await this.shareLogRepository.create({
      shareId: share.id,
      action,
      visitorIp,
      userAgent,
      platform: share.platform,
      metadata,
    });

    this.logger.log(`Share tracked: ${share.id}, action: ${action}`);
  }

  private async findActiveByShareCode(shareCode: string): Promise<Share> {
    const share = await this.shareRepository.findByShareCode(shareCode);

    if (!share || share.deletedAt) {
      throw new NotFoundException('Share not found');
    }

    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new GoneException('Share has expired');
    }

    return share;
  }

  async getStats(id: number, userId: number): Promise<ShareStatsDto> {
    const share = await this.shareRepository.findByIdAndUserId(id, userId);

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    const conversionRate = share.viewCount > 0 ? share.conversionCount / share.viewCount : 0;

    return {
      viewCount: share.viewCount,
      clickCount: share.clickCount,
      conversionCount: share.conversionCount,
      conversionRate: Number(conversionRate.toFixed(4)),
    };
  }

  async remove(id: number, userId: number): Promise<void> {
    const share = await this.shareRepository.findByIdAndUserId(id, userId);

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    await this.shareRepository.remove(id);
    this.logger.log(`Share deleted: ${id}`);
  }

  async count(userId: number, queryShareDto?: QueryShareDto): Promise<number> {
    return this.shareRepository.countByUserId(userId, queryShareDto);
  }
}
