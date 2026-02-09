import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { OrNeverType } from '../../../common/types/or-never.type';
import { JwtPayloadType } from './types/jwt-payload.type';
import { AllConfigType } from '../../../config/config.type';
import { UsersService } from '../../users/users.service';
import { isUserStatusAllowedForAuth } from '../../../common/utils/status.util';

/** JWT 用户校验缓存 TTL：30 秒（平衡安全性与性能） */
const JWT_USER_CACHE_TTL_MS = 30_000;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService<AllConfigType>,
    private readonly usersService: UsersService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('auth.secret', { infer: true }),
    });
  }

  public async validate(payload: JwtPayloadType): Promise<OrNeverType<JwtPayloadType>> {
    if (!payload.id) {
      throw new UnauthorizedException();
    }

    // 先查缓存，避免每次请求都查库
    const cacheKey = `jwt:user:${payload.id}`;
    const cached = await this.cacheManager.get<{ statusId?: number }>(cacheKey);

    if (cached) {
      if (!isUserStatusAllowedForAuth(cached.statusId)) {
        throw new UnauthorizedException('User is not active');
      }
      return payload;
    }

    // 缓存未命中，查库
    const user = await this.usersService.findById(payload.id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!isUserStatusAllowedForAuth(user.status?.id)) {
      throw new UnauthorizedException('User is not active');
    }

    // 写入缓存
    await this.cacheManager.set(cacheKey, { statusId: user.status?.id }, JWT_USER_CACHE_TTL_MS);

    return payload;
  }
}
