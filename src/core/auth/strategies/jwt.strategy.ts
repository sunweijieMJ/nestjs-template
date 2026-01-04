import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { OrNeverType } from '../../../common/types/or-never.type';
import { JwtPayloadType } from './types/jwt-payload.type';
import { AllConfigType } from '../../../config/config.type';
import { UsersService } from '../../users/users.service';
import { StatusEnum } from '../../../common/enums/statuses/statuses.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService<AllConfigType>,
    private readonly usersService: UsersService,
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

    // Verify user still exists and is active
    const user = await this.usersService.findById(payload.id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status?.id !== StatusEnum.active) {
      throw new UnauthorizedException('User is not active');
    }

    return payload;
  }
}
