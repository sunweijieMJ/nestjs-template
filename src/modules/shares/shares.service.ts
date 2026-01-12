import { Injectable, Logger, NotFoundException, GoneException, ConflictException } from '@nestjs/common';
import { CreateShareDto } from './dto/create-share.dto';
import { QueryShareDto } from './dto/query-share.dto';
import { ShareRepository } from './infrastructure/persistence/share.repository';
import { ShareLogRepository } from './infrastructure/persistence/share-log.repository';
import { Share } from './domain/share';
import { ShareLogAction } from './domain/share-log';
import { IPaginationOptions } from '../../common/types/pagination-options';
import { generateShareCode } from './utils/share-code.util';
import { ShareStatsDto } from './dto/share-stats.dto';

@Injectable()
export class SharesService {
  private readonly logger = new Logger(SharesService.name);

  constructor(
    private readonly shareRepository: ShareRepository,
    private readonly shareLogRepository: ShareLogRepository,
  ) {}

  async create(userId: number | string, createShareDto: CreateShareDto): Promise<Share> {
    this.logger.log(`Creating share for user: ${userId}`);

    // Generate unique share code with retry mechanism
    const maxRetries = 5;
    let share: Share | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const shareCode = generateShareCode();

      try {
        // Create share in database
        share = await this.shareRepository.create({
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
      } catch (error: any) {
        // Check if it's a unique constraint violation
        if (error.code === '23505' && attempt < maxRetries - 1) {
          this.logger.warn(`ShareCode collision detected, retrying... (attempt ${attempt + 1}/${maxRetries})`);
          continue;
        }
        throw error;
      }
    }

    throw new ConflictException('Failed to generate unique share code after multiple attempts');
  }

  async findManyWithPagination(
    userId: number | string,
    queryShareDto: QueryShareDto,
    paginationOptions: IPaginationOptions,
  ): Promise<Share[]> {
    return this.shareRepository.findManyWithPagination({
      userId,
      filterOptions: queryShareDto,
      paginationOptions,
    });
  }

  async findOne(id: number | string, userId: number | string): Promise<Share> {
    const share = await this.shareRepository.findByIdAndUserId(id, userId);

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    return share;
  }

  async findByShareCode(shareCode: string, visitorIp?: string, userAgent?: string): Promise<Share> {
    const share = await this.shareRepository.findByShareCode(shareCode);

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    // Check if share is deleted
    if (share.deletedAt) {
      throw new NotFoundException('Share not found');
    }

    // Check if share is expired
    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new GoneException('Share has expired');
    }

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
    id: number | string,
    action: ShareLogAction,
    visitorIp?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const share = await this.shareRepository.findById(id);

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    // Increment corresponding count
    if (action === ShareLogAction.CLICK) {
      await this.shareRepository.incrementClickCount(id);
    } else if (action === ShareLogAction.CONVERSION) {
      await this.shareRepository.incrementConversionCount(id);
    }

    // Log the action
    await this.shareLogRepository.create({
      shareId: id,
      action,
      visitorIp,
      userAgent,
      platform: share.platform,
      metadata,
    });

    this.logger.log(`Share tracked: ${id}, action: ${action}`);
  }

  async getStats(id: number | string, userId: number | string): Promise<ShareStatsDto> {
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

  async remove(id: number | string, userId: number | string): Promise<void> {
    const share = await this.shareRepository.findByIdAndUserId(id, userId);

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    await this.shareRepository.remove(id);
    this.logger.log(`Share deleted: ${id}`);
  }

  async count(userId: number | string, queryShareDto?: QueryShareDto): Promise<number> {
    return this.shareRepository.countByUserId(userId, queryShareDto);
  }
}
