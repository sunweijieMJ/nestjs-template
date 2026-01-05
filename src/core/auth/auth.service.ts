import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import ms from 'ms';
import crypto from 'crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { JwtService, TokenExpiredError, JsonWebTokenError } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { AuthProvidersEnum } from './auth-providers.enum';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { NullableType } from '../../common/types/nullable.type';
import { LoginResponseDto } from './dto/login-response.dto';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
import { UsersService } from '../users/users.service';
import { AllConfigType } from '../../config/config.type';
import { MailService } from '../../integrations/mail/mail.service';
import { RoleEnum } from '../../common/enums/roles/roles.enum';
import { Session } from '../session/domain/session';
import { SessionService } from '../session/session.service';
import { StatusEnum } from '../../common/enums/statuses/statuses.enum';
import { User } from '../users/domain/user';
import { SmsService, SmsCodeType } from '../../integrations/sms/sms.service';
import { AuthPhoneLoginDto } from './dto/auth-phone-login.dto';
import { AuthPhoneSmsLoginDto } from './dto/auth-phone-sms-login.dto';
import { AuthPhoneRegisterDto } from './dto/auth-phone-register.dto';
import { AuthWechatLoginDto, WechatLoginType } from './dto/auth-wechat-login.dto';
import { WechatService } from '../../integrations/wechat/wechat.service';
import { maskEmail, maskPhone } from '../../common/utils/sanitize.utils';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private sessionService: SessionService,
    private mailService: MailService,
    private configService: ConfigService<AllConfigType>,
    private smsService: SmsService,
    private wechatService: WechatService,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Login attempt for email: ${maskEmail(loginDto.email)}`);
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      this.logger.warn(`Login failed - user not found: ${maskEmail(loginDto.email)}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'notFound',
        },
      });
    }

    if (user.provider !== AuthProvidersEnum.email) {
      this.logger.warn(`Login failed - wrong provider for user ${user.id}: ${user.provider}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: `needLoginViaProvider:${user.provider}`,
        },
      });
    }

    if (!user.password) {
      this.logger.warn(`Login failed - no password set for user: ${user.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    const isValidPassword = await bcrypt.compare(loginDto.password, user.password);

    if (!isValidPassword) {
      this.logger.warn(`Login failed - incorrect password for user: ${user.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    // Allow inactive users to login (they just haven't confirmed email yet)
    // Only block if status is explicitly set to something other than active/inactive
    // Note: MongoDB uses string IDs, PostgreSQL uses number IDs
    const statusId = user.status?.id;
    const isActive = statusId === StatusEnum.active || statusId === String(StatusEnum.active);
    const isInactive = statusId === StatusEnum.inactive || statusId === String(StatusEnum.inactive);

    if (!isActive && !isInactive) {
      this.logger.warn(`Login failed - user status not allowed: ${user.id}, status: ${statusId}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'userNotActive',
        },
      });
    }

    this.logger.log(`Login successful for user: ${user.id}`);
    return this.createSessionAndTokens(user);
  }

  async register(dto: AuthRegisterLoginDto): Promise<void> {
    this.logger.log(`Registration attempt for email: ${maskEmail(dto.email)}`);

    const user = await this.usersService.create({
      ...dto,
      email: dto.email,
      role: {
        id: RoleEnum.user,
      },
      status: {
        id: StatusEnum.inactive,
      },
    });

    this.logger.log(`User registered successfully: ${user.id}`);

    const hash = await this.jwtService.signAsync(
      {
        confirmEmailUserId: user.id,
      },
      {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow('auth.confirmEmailExpires', {
          infer: true,
        }),
      },
    );

    await this.mailService.userSignUp({
      to: dto.email,
      data: {
        hash,
      },
    });

    this.logger.log(`Confirmation email sent to: ${maskEmail(dto.email)}`);
  }

  async confirmEmail(hash: string): Promise<void> {
    this.logger.log('Email confirmation attempt');
    let userId: User['id'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: User['id'];
      }>(hash, {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
      });

      userId = jwtData.confirmEmailUserId;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        this.logger.warn('Email confirmation failed - token expired');
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            hash: 'tokenExpired',
          },
        });
      }
      if (error instanceof JsonWebTokenError) {
        this.logger.warn('Email confirmation failed - invalid hash');
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            hash: 'invalidHash',
          },
        });
      }
      throw error;
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      this.logger.warn(`Email confirmation failed - user not found: ${userId}`);
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: 'notFound',
      });
    }

    if (user.status?.id !== StatusEnum.inactive) {
      this.logger.warn(`Email confirmation failed - user already active: ${userId}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: 'alreadyConfirmed',
        },
      });
    }

    user.status = {
      id: StatusEnum.active,
    };

    await this.usersService.update(user.id, user);
    this.logger.log(`Email confirmed for user: ${userId}`);
  }

  async confirmNewEmail(hash: string): Promise<void> {
    let userId: User['id'];
    let newEmail: User['email'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: User['id'];
        newEmail: User['email'];
      }>(hash, {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
      });

      userId = jwtData.confirmEmailUserId;
      newEmail = jwtData.newEmail;
    } catch (error) {
      this.logger.warn('New email confirmation failed - invalid hash', { error });
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: `notFound`,
      });
    }

    user.email = newEmail;
    user.status = {
      id: StatusEnum.active,
    };

    await this.usersService.update(user.id, user);
  }

  async forgotPassword(email: string): Promise<void> {
    this.logger.log(`Password reset requested for: ${maskEmail(email)}`);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.warn(`Password reset failed - email not found: ${maskEmail(email)}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailNotExists',
        },
      });
    }

    const tokenExpiresIn = this.configService.getOrThrow('auth.forgotExpires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const hash = await this.jwtService.signAsync(
      {
        forgotUserId: user.id,
      },
      {
        secret: this.configService.getOrThrow('auth.forgotSecret', {
          infer: true,
        }),
        expiresIn: tokenExpiresIn,
      },
    );

    await this.mailService.forgotPassword({
      to: email,
      data: {
        hash,
        tokenExpires,
      },
    });

    this.logger.log(`Password reset email sent to: ${maskEmail(email)}`);
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    this.logger.log('Password reset attempt');
    let userId: User['id'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        forgotUserId: User['id'];
      }>(hash, {
        secret: this.configService.getOrThrow('auth.forgotSecret', {
          infer: true,
        }),
      });

      userId = jwtData.forgotUserId;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        this.logger.warn('Password reset failed - token expired');
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            hash: 'tokenExpired',
          },
        });
      }
      if (error instanceof JsonWebTokenError) {
        this.logger.warn('Password reset failed - invalid hash');
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            hash: 'invalidHash',
          },
        });
      }
      throw error;
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      this.logger.warn(`Password reset failed - user not found: ${userId}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `notFound`,
        },
      });
    }

    user.password = password;

    await this.sessionService.deleteByUserId({
      userId: user.id,
    });

    await this.usersService.update(user.id, user);
    this.logger.log(`Password reset successful for user: ${userId}`);
  }

  async me(userJwtPayload: JwtPayloadType): Promise<NullableType<User>> {
    return this.usersService.findById(userJwtPayload.id);
  }

  async update(userJwtPayload: JwtPayloadType, userDto: AuthUpdateDto): Promise<NullableType<User>> {
    const currentUser = await this.usersService.findById(userJwtPayload.id);

    if (!currentUser) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    if (userDto.password) {
      if (!userDto.oldPassword) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'missingOldPassword',
          },
        });
      }

      if (!currentUser.password) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'incorrectOldPassword',
          },
        });
      }

      const isValidOldPassword = await bcrypt.compare(userDto.oldPassword, currentUser.password);

      if (!isValidOldPassword) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'incorrectOldPassword',
          },
        });
      } else {
        await this.sessionService.deleteByUserIdWithExclude({
          userId: currentUser.id,
          excludeSessionId: userJwtPayload.sessionId,
        });
      }
    }

    if (userDto.email && userDto.email !== currentUser.email) {
      const userByEmail = await this.usersService.findByEmail(userDto.email);

      if (userByEmail && userByEmail.id !== currentUser.id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailExists',
          },
        });
      }

      const hash = await this.jwtService.signAsync(
        {
          confirmEmailUserId: currentUser.id,
          newEmail: userDto.email,
        },
        {
          secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.confirmEmailExpires', {
            infer: true,
          }),
        },
      );

      await this.mailService.confirmNewEmail({
        to: userDto.email,
        data: {
          hash,
        },
      });
    }

    delete userDto.email;
    delete userDto.oldPassword;

    await this.usersService.update(userJwtPayload.id, userDto);

    return this.usersService.findById(userJwtPayload.id);
  }

  async refreshToken(data: Pick<JwtRefreshPayloadType, 'sessionId' | 'hash'>): Promise<Omit<LoginResponseDto, 'user'>> {
    this.logger.debug(`Token refresh attempt for session: ${data.sessionId}`);
    const session = await this.sessionService.findById(data.sessionId);

    if (!session) {
      this.logger.warn(`Token refresh failed - session not found: ${data.sessionId}`);
      throw new UnauthorizedException();
    }

    if (session.hash !== data.hash) {
      this.logger.warn(`Token refresh failed - hash mismatch for session: ${data.sessionId}`);
      throw new UnauthorizedException();
    }

    const hash = this.generateSessionHash();

    const user = await this.usersService.findById(session.user.id);

    if (!user?.role) {
      this.logger.warn(`Token refresh failed - user not found for session: ${data.sessionId}`);
      throw new UnauthorizedException();
    }

    await this.sessionService.update(session.id, {
      hash,
    });

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: session.user.id,
      role: {
        id: user.role.id,
      },
      sessionId: session.id,
      hash,
    });

    this.logger.debug(`Token refreshed for user: ${session.user.id}`);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  async softDelete(user: Pick<User, 'id'>): Promise<void> {
    this.logger.log(`User account deletion requested: ${user.id}`);
    await this.usersService.remove(user.id);
    this.logger.log(`User account deleted: ${user.id}`);
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>): Promise<void> {
    this.logger.log(`Logout for session: ${data.sessionId}`);
    return this.sessionService.deleteById(data.sessionId);
  }

  async sendCode(phone: string, type: SmsCodeType = SmsCodeType.LOGIN): Promise<void> {
    this.logger.log(`Send SMS code request for phone: ${maskPhone(phone)}, type: ${type}`);

    // For register type, check if phone already exists
    if (type === SmsCodeType.REGISTER) {
      const existingUser = await this.usersService.findByPhone(phone);
      if (existingUser) {
        this.logger.warn(`Phone already registered: ${maskPhone(phone)}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            phone: 'phoneAlreadyExists',
          },
        });
      }
    }

    // For login/reset_password type, check if phone exists
    if (type === SmsCodeType.LOGIN || type === SmsCodeType.RESET_PASSWORD) {
      const user = await this.usersService.findByPhone(phone);
      if (!user) {
        this.logger.warn(`Phone not found: ${maskPhone(phone)}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            phone: 'phoneNotFound',
          },
        });
      }
    }

    const sendResult = await this.smsService.sendCode(phone, type);
    if (!sendResult.success) {
      this.logger.warn(`Failed to send SMS code to ${maskPhone(phone)}: ${sendResult.message}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          phone: sendResult.retryAfter ? 'rateLimited' : 'sendFailed',
          retryAfter: sendResult.retryAfter,
        },
      });
    }
    this.logger.log(`SMS code sent to: ${maskPhone(phone)}`);
  }

  async validatePhoneLogin(loginDto: AuthPhoneLoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Phone login attempt for: ${maskPhone(loginDto.phone)}`);
    const user = await this.usersService.findByPhone(loginDto.phone);

    if (!user) {
      this.logger.warn(`Phone login failed - user not found: ${maskPhone(loginDto.phone)}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'incorrectPhoneOrPassword',
        errors: {
          credentials: 'incorrectPhoneOrPassword',
        },
      });
    }

    if (user.provider !== AuthProvidersEnum.phone) {
      this.logger.warn(`Phone login failed - wrong provider for user ${user.id}: ${user.provider}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: `needLoginViaProvider:${user.provider}`,
        errors: {
          phone: `needLoginViaProvider:${user.provider}`,
        },
      });
    }

    if (!user.password) {
      this.logger.warn(`Phone login failed - no password set for user: ${user.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'incorrectPhoneOrPassword',
        errors: {
          credentials: 'incorrectPhoneOrPassword',
        },
      });
    }

    const isValidPassword = await bcrypt.compare(loginDto.password, user.password);

    if (!isValidPassword) {
      this.logger.warn(`Phone login failed - incorrect password for user: ${user.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'incorrectPhoneOrPassword',
        errors: {
          credentials: 'incorrectPhoneOrPassword',
        },
      });
    }

    if (user.status?.id !== StatusEnum.active) {
      this.logger.warn(`Phone login failed - user not active: ${user.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'userNotActive',
        errors: {
          phone: 'userNotActive',
        },
      });
    }

    this.logger.log(`Phone login successful for user: ${user.id}`);
    return this.createSessionAndTokens(user);
  }

  async validatePhoneSmsLogin(loginDto: AuthPhoneSmsLoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Phone SMS login attempt for: ${maskPhone(loginDto.phone)}`);

    // Verify SMS code
    const verifyResult = await this.smsService.verifyCode(loginDto.phone, loginDto.code, SmsCodeType.LOGIN);
    if (!verifyResult.success) {
      this.logger.warn(`Phone SMS login failed - invalid code for: ${maskPhone(loginDto.phone)}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          code: 'invalidCode',
        },
      });
    }

    const user = await this.usersService.findByPhone(loginDto.phone);

    if (!user) {
      this.logger.warn(`Phone SMS login failed - user not found: ${maskPhone(loginDto.phone)}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          phone: 'notFound',
        },
      });
    }

    if (user.status?.id !== StatusEnum.active) {
      this.logger.warn(`Phone SMS login failed - user not active: ${user.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          phone: 'userNotActive',
        },
      });
    }

    this.logger.log(`Phone SMS login successful for user: ${user.id}`);
    return this.createSessionAndTokens(user);
  }

  async registerByPhone(dto: AuthPhoneRegisterDto): Promise<LoginResponseDto> {
    this.logger.log(`Phone registration attempt for: ${maskPhone(dto.phone)}`);

    // Verify SMS code only if provided (code-based registration)
    if (dto.code) {
      const verifyResult = await this.smsService.verifyCode(dto.phone, dto.code, SmsCodeType.REGISTER);
      if (!verifyResult.success) {
        this.logger.warn(`Phone registration failed - invalid code for: ${maskPhone(dto.phone)}`);
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            code: 'invalidCode',
          },
        });
      }
    }

    // Check if phone already exists
    const existingUser = await this.usersService.findByPhone(dto.phone);
    if (existingUser) {
      this.logger.warn(`Phone registration failed - phone already exists: ${maskPhone(dto.phone)}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          phone: 'phoneAlreadyExists',
        },
      });
    }

    const user = await this.usersService.create({
      phone: dto.phone,
      password: dto.password,
      nickname: dto.nickname,
      provider: AuthProvidersEnum.phone,
      role: {
        id: RoleEnum.user,
      },
      status: {
        id: StatusEnum.active,
      },
    });

    this.logger.log(`User registered successfully via phone: ${user.id}`);
    return this.createSessionAndTokens(user);
  }

  async changePassword(userJwtPayload: JwtPayloadType, oldPassword: string, newPassword: string): Promise<void> {
    this.logger.log(`Password change attempt for user: ${userJwtPayload.id}`);

    const user = await this.usersService.findById(userJwtPayload.id);

    if (!user) {
      this.logger.warn(`Password change failed - user not found: ${userJwtPayload.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    if (!user.password) {
      this.logger.warn(`Password change failed - no password set for user: ${userJwtPayload.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          oldPassword: 'incorrectOldPassword',
        },
      });
    }

    const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);

    if (!isValidOldPassword) {
      this.logger.warn(`Password change failed - incorrect old password for user: ${userJwtPayload.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          oldPassword: 'incorrectOldPassword',
        },
      });
    }

    // Update password
    await this.usersService.update(userJwtPayload.id, { password: newPassword });

    // Invalidate all other sessions
    await this.sessionService.deleteByUserIdWithExclude({
      userId: userJwtPayload.id,
      excludeSessionId: userJwtPayload.sessionId,
    });

    this.logger.log(`Password changed successfully for user: ${userJwtPayload.id}`);
  }

  async wechatLogin(dto: AuthWechatLoginDto): Promise<LoginResponseDto> {
    this.logger.log(`WeChat login attempt with type: ${dto.type}`);

    // Get user info from WeChat
    const wechatUserInfo =
      dto.type === WechatLoginType.MINI_APP
        ? await this.wechatService.miniAppLogin(dto.code)
        : await this.wechatService.appLogin(dto.code);

    // Check if user already exists
    let user = await this.usersService.findByWechatOpenId(wechatUserInfo.openId);

    if (!user) {
      // Create new user for first-time WeChat login
      this.logger.log(`Creating new user for WeChat openId: ${wechatUserInfo.openId}`);

      user = await this.usersService.create({
        wechatOpenId: wechatUserInfo.openId,
        wechatUnionId: wechatUserInfo.unionId,
        nickname: dto.nickname ?? wechatUserInfo.nickname ?? '微信用户',
        gender: wechatUserInfo.gender ?? 0,
        provider: AuthProvidersEnum.wechat,
        role: {
          id: RoleEnum.user,
        },
        status: {
          id: StatusEnum.active,
        },
      });

      this.logger.log(`New WeChat user created: ${user.id}`);
    } else {
      this.logger.log(`Existing user found for WeChat openId: ${wechatUserInfo.openId}`);
    }

    this.logger.log(`WeChat login successful for user: ${user.id}`);
    return this.createSessionAndTokens(user);
  }

  /**
   * Generate a secure session hash
   */
  private generateSessionHash(): string {
    return crypto.createHash('sha256').update(randomStringGenerator()).digest('hex');
  }

  /**
   * Create session and generate tokens for a user
   */
  private async createSessionAndTokens(user: User): Promise<LoginResponseDto> {
    const hash = this.generateSessionHash();

    const session = await this.sessionService.create({
      user,
      hash,
    });

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      role: user.role,
      sessionId: session.id,
      hash,
    });

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
    };
  }

  private async getTokensData(data: {
    id: User['id'];
    role: User['role'];
    sessionId: Session['id'];
    hash: Session['hash'];
  }): Promise<{ token: string; refreshToken: string; tokenExpires: number }> {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: data.id,
          role: data.role,
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }
}
