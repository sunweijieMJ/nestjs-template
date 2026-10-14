import type { Mocked } from 'vitest';
import { GoneException, NotFoundException } from '@nestjs/common';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SharesService } from './shares.service';
import { ShareRepository } from './infrastructure/persistence/share.repository';
import { ShareLogRepository } from './infrastructure/persistence/share-log.repository';
import { Share } from './domain/share';
import { ShareLogAction } from './domain/share-log';
import { TrackShareDto } from './dto/track-share.dto';

function buildShare(overrides: Partial<Share> = {}): Share {
  return { id: 7, userId: 1, shareCode: 'CODE', platform: 'WECHAT', ...overrides } as Share;
}

describe('SharesService', () => {
  let shareRepository: Mocked<
    Pick<ShareRepository, 'findByShareCode' | 'incrementClickCount' | 'incrementConversionCount'>
  >;
  let shareLogRepository: Mocked<Pick<ShareLogRepository, 'create'>>;
  let service: SharesService;

  beforeEach(() => {
    shareRepository = {
      findByShareCode: vi.fn(),
      incrementClickCount: vi.fn(),
      incrementConversionCount: vi.fn(),
    };
    shareLogRepository = { create: vi.fn() };
    service = new SharesService(
      shareRepository as unknown as ShareRepository,
      shareLogRepository as unknown as ShareLogRepository,
    );
  });

  describe('trackShare', () => {
    it('should count the click on the share found by its code', async () => {
      shareRepository.findByShareCode.mockResolvedValue(buildShare());

      await service.trackShare('CODE', ShareLogAction.CLICK, '1.1.1.1', 'UA');

      expect(shareRepository.incrementClickCount).toHaveBeenCalledWith(7);
      expect(shareLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ shareId: 7, action: ShareLogAction.CLICK }),
      );
    });

    it('should throw 404 when the share code does not exist', async () => {
      shareRepository.findByShareCode.mockResolvedValue(null);

      await expect(service.trackShare('NOPE', ShareLogAction.CLICK)).rejects.toBeInstanceOf(NotFoundException);
      expect(shareLogRepository.create).not.toHaveBeenCalled();
    });

    it('should throw 410 without counting when the share has expired', async () => {
      shareRepository.findByShareCode.mockResolvedValue(buildShare({ expiresAt: new Date(Date.now() - 1000) }));

      await expect(service.trackShare('CODE', ShareLogAction.CONVERSION)).rejects.toBeInstanceOf(GoneException);
      expect(shareRepository.incrementConversionCount).not.toHaveBeenCalled();
    });
  });
});

describe('TrackShareDto', () => {
  it('should reject metadata larger than the limit', async () => {
    const dto = plainToInstance(TrackShareDto, { action: ShareLogAction.CLICK, metadata: { blob: 'x'.repeat(3000) } });
    const [error] = await validate(dto);
    expect(error.property).toBe('metadata');
    expect(Object.values(error.constraints ?? {})).toEqual(['metadataTooLarge']);
  });

  it('should accept small metadata', async () => {
    const dto = plainToInstance(TrackShareDto, { action: ShareLogAction.CLICK, metadata: { from: 'feed' } });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});

describe('Share serialization', () => {
  const share = Object.assign(new Share(), { id: 7, userId: 1, shareCode: 'CODE', metadata: { a: 1 }, viewCount: 3 });

  it.each(['userId', 'metadata', 'viewCount'])('should hide %s from public responses', (field) => {
    expect(instanceToPlain(share)).not.toHaveProperty(field);
  });

  it('should expose the owner fields to the owner', () => {
    expect(instanceToPlain(share, { groups: ['owner'] })).toMatchObject({ userId: 1, metadata: { a: 1 } });
  });
});
