import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import ms from 'ms';
import { JwtService, TokenExpiredError, JsonWebTokenError } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { hashPassword, comparePassword } from '../../common/utils/crypto.utils';
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
import { TokenService } from './services/token.service';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { verifySmsCode, validateUserStatusForAuth } from './helpers/auth-validation.helper';
import { SessionEntity } from '../session/infrastructure/persistence/relational/entities/session.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';

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
    private tokenService: TokenService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  /**
   * 验证邮箱登录
   * @param loginDto - 邮箱登录数据传输对象
   * @returns 登录响应，包含用户信息和令牌
   * @throws UnprocessableEntityException 当邮箱不存在、密码错误或用户状态不允许登录时
   */
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
      // 返回通用错误信息，避免泄露用户注册渠道
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
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

    const isValidPassword = await comparePassword(loginDto.password, user.password);

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
    validateUserStatusForAuth(user, 'email', this.logger);

    this.logger.log(`Login successful for user: ${user.id}`);
    return this.createSessionAndTokens(user);
  }

  /**
   * 用户注册
   * @param dto - 注册数据传输对象
   * @throws UnprocessableEntityException 当邮箱已存在时
   */
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

    // Initialize default notification settings for new user
    // 使用 try-catch 确保通知设置失败不影响注册流程
    try {
      await this.notificationsService.initializeDefaultSettings(user.id);
    } catch (error) {
      this.logger.warn(`Failed to initialize notification settings for user ${user.id}`, { error });
      // 不抛出错误，通知设置可以稍后补充
    }

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

  /**
   * 确认邮箱
   * @param hash - JWT 令牌哈希值
   * @throws UnprocessableEntityException 当令牌过期、无效或用户已激活时
   * @throws NotFoundException 当用户不存在时
   */
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

    await this.usersService.update(user.id, {
      status: { id: StatusEnum.active },
    });
    this.logger.log(`Email confirmed for user: ${userId}`);
  }

  /**
   * 确认新邮箱
   * @param hash - JWT 令牌哈希值，包含新邮箱信息
   * @throws UnprocessableEntityException 当令牌过期或无效时
   * @throws NotFoundException 当用户不存在时
   */
  async confirmNewEmail(hash: string): Promise<void> {
    this.logger.log('New email confirmation attempt');
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
      if (error instanceof TokenExpiredError) {
        this.logger.warn('New email confirmation failed - token expired');
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            hash: 'tokenExpired',
          },
        });
      }
      if (error instanceof JsonWebTokenError) {
        this.logger.warn('New email confirmation failed - invalid hash');
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
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: `notFound`,
      });
    }

    await this.usersService.update(user.id, {
      email: newEmail,
      status: { id: StatusEnum.active },
    });
  }

  /**
   * 忘记密码 - 发送重置密码邮件
   * @param email - 用户邮箱
   * @throws UnprocessableEntityException 当邮箱不存在时
   */
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

  /**
   * 重置密码
   * @param hash - JWT 令牌哈希值
   * @param password - 新密码（明文）
   * @throws UnprocessableEntityException 当令牌过期、无效或用户不存在时
   */
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

    // Encrypt password before updating
    const hashedPassword = await hashPassword(password);

    // 使用事务确保删除会话和更新密码的原子性
    await this.dataSource.transaction(async (manager) => {
      // Delete all user sessions
      await manager.softDelete(SessionEntity, {
        user: { id: Number(user.id) },
      });

      // Update password
      await manager.update(UserEntity, { id: Number(user.id) }, { password: hashedPassword });
    });

    this.logger.log(`Password reset successful for user: ${userId}`);
  }

  /**
   * 通过手机验证码重置密码
   * @param phone - 手机号
   * @param code - 短信验证码
   * @param password - 新密码（明文）
   * @throws UnprocessableEntityException 当手机号不存在、验证码错误或用户状态不允许时
   */
  async resetPasswordByPhone(phone: string, code: string, password: string): Promise<void> {
    this.logger.log(`Phone password reset attempt for: ${maskPhone(phone)}`);

    // 验证短信验证码
    const isValidCode = await this.smsService.verifyCode(phone, code, SmsCodeType.RESET_PASSWORD);
    if (!isValidCode) {
      this.logger.warn(`Phone password reset failed - invalid code for: ${maskPhone(phone)}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          code: 'invalidCode',
        },
      });
    }

    // 查找用户
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      this.logger.warn(`Phone password reset failed - phone not found: ${maskPhone(phone)}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          phone: 'phoneNotExists',
        },
      });
    }

    // 检查用户状态
    validateUserStatusForAuth(user, 'phone', this.logger);

    // 加密新密码
    const hashedPassword = await hashPassword(password);

    // 使用事务确保删除会话和更新密码的原子性
    await this.dataSource.transaction(async (manager) => {
      // 删除所有用户会话
      await manager.softDelete(SessionEntity, {
        user: { id: Number(user.id) },
      });

      // 更新密码
      await manager.update(UserEntity, { id: Number(user.id) }, { password: hashedPassword });
    });

    this.logger.log(`Phone password reset successful for user: ${user.id}`);
  }

  /**
   * 获取当前用户信息
   * @param userJwtPayload - JWT 载荷信息
   * @returns 用户信息或 null
   */
  async me(userJwtPayload: JwtPayloadType): Promise<NullableType<User>> {
    return this.usersService.findById(userJwtPayload.id);
  }

  /**
   * 更新用户信息
   * @param userJwtPayload - JWT 载荷信息
   * @param userDto - 更新数据传输对象
   * @returns 更新后的用户信息或 null
   * @throws UnprocessableEntityException 当用户不存在、密码验证失败或邮箱已被占用时
   */
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

      const isValidOldPassword = await comparePassword(userDto.oldPassword, currentUser.password);

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

      // Remove email from update - it will be updated after confirmation
      delete userDto.email;
    }

    delete userDto.oldPassword;

    await this.usersService.update(userJwtPayload.id, userDto);

    return this.usersService.findById(userJwtPayload.id);
  }

  /**
   * 刷新访问令牌
   * @param data - 包含会话ID和哈希值的数据
   * @returns 新的访问令牌和刷新令牌
   * @throws UnauthorizedException 当会话不存在或哈希值不匹配时
   */
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

    const hash = this.tokenService.generateSessionHash();

    const user = await this.usersService.findById(session.user.id);

    if (!user?.role) {
      this.logger.warn(`Token refresh failed - user not found for session: ${data.sessionId}`);
      throw new UnauthorizedException();
    }

    await this.sessionService.update(session.id, {
      hash,
    });

    const { token, refreshToken, tokenExpires } = await this.tokenService.getTokensData({
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

  /**
   * 软删除用户账户
   * @param user - 包含用户ID的对象
   */
  async softDelete(user: Pick<User, 'id'>): Promise<void> {
    this.logger.log(`User account deletion requested: ${user.id}`);
    await this.usersService.remove(user.id);
    this.logger.log(`User account deleted: ${user.id}`);
  }

  /**
   * 用户登出
   * @param data - 包含会话ID的数据
   */
  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>): Promise<void> {
    this.logger.log(`Logout for session: ${data.sessionId}`);
    return this.sessionService.deleteById(data.sessionId);
  }

  /**
   * 发送短信验证码
   * @param phone - 手机号
   * @param type - 验证码类型（登录、注册、重置密码等）
   * @throws UnprocessableEntityException 当手机号已存在（注册）或不存在（登录/重置密码）或发送失败时
   */
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

  /**
   * 验证手机号密码登录
   * @param loginDto - 手机号登录数据传输对象
   * @returns 登录响应，包含用户信息和令牌
   * @throws UnprocessableEntityException 当手机号不存在、密码错误或用户状态不允许登录时
   */
  async validatePhoneLogin(loginDto: AuthPhoneLoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Phone login attempt for: ${maskPhone(loginDto.phone)}`);
    const user = await this.usersService.findByPhone(loginDto.phone);

    if (!user) {
      this.logger.warn(`Phone login failed - user not found: ${maskPhone(loginDto.phone)}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          credentials: 'incorrectPhoneOrPassword',
        },
      });
    }

    if (user.provider !== AuthProvidersEnum.phone) {
      this.logger.warn(`Phone login failed - wrong provider for user ${user.id}: ${user.provider}`);
      // 返回通用错误信息，避免泄露用户注册渠道
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          credentials: 'incorrectPhoneOrPassword',
        },
      });
    }

    if (!user.password) {
      this.logger.warn(`Phone login failed - no password set for user: ${user.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          credentials: 'incorrectPhoneOrPassword',
        },
      });
    }

    const isValidPassword = await comparePassword(loginDto.password, user.password);

    if (!isValidPassword) {
      this.logger.warn(`Phone login failed - incorrect password for user: ${user.id}`);
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          credentials: 'incorrectPhoneOrPassword',
        },
      });
    }

    // Allow both active and inactive users to login (consistent with email login)
    validateUserStatusForAuth(user, 'phone', this.logger);

    this.logger.log(`Phone login successful for user: ${user.id}`);
    return this.createSessionAndTokens(user);
  }

  /**
   * 验证手机号短信验证码登录
   * @param loginDto - 手机号短信登录数据传输对象
   * @returns 登录响应，包含用户信息和令牌
   * @throws UnprocessableEntityException 当验证码无效、手机号不存在或用户状态不允许登录时
   */
  async validatePhoneSmsLogin(loginDto: AuthPhoneSmsLoginDto): Promise<LoginResponseDto> {
    this.logger.log(`Phone SMS login attempt for: ${maskPhone(loginDto.phone)}`);

    // Verify SMS code
    await verifySmsCode(this.smsService, loginDto.phone, loginDto.code, SmsCodeType.LOGIN, this.logger);

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

    // Allow both active and inactive users to login (consistent with email login)
    validateUserStatusForAuth(user, 'phone', this.logger);

    this.logger.log(`Phone SMS login successful for user: ${user.id}`);
    return this.createSessionAndTokens(user);
  }

  /**
   * 手机号注册
   * @param dto - 手机号注册数据传输对象
   * @returns 登录响应，包含用户信息和令牌
   * @throws UnprocessableEntityException 当验证码无效或手机号已存在时
   */
  async registerByPhone(dto: AuthPhoneRegisterDto): Promise<LoginResponseDto> {
    this.logger.log(`Phone registration attempt for: ${maskPhone(dto.phone)}`);

    // Verify SMS code only if provided (code-based registration)
    if (dto.code) {
      await verifySmsCode(this.smsService, dto.phone, dto.code, SmsCodeType.REGISTER, this.logger);
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

    // Initialize default notification settings for new user
    try {
      await this.notificationsService.initializeDefaultSettings(user.id);
    } catch (error) {
      this.logger.warn(`Failed to initialize notification settings for user ${user.id}`, { error });
    }

    return this.createSessionAndTokens(user);
  }

  /**
   * 修改密码
   * @param userJwtPayload - JWT 载荷信息
   * @param oldPassword - 旧密码
   * @param newPassword - 新密码
   * @throws UnprocessableEntityException 当用户不存在或旧密码错误时
   */
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

    const isValidOldPassword = await comparePassword(oldPassword, user.password);

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

  /**
   * 微信登录
   * @param dto - 微信登录数据传输对象
   * @returns 登录响应，包含用户信息和令牌
   */
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

      // Initialize default notification settings for new user
      try {
        await this.notificationsService.initializeDefaultSettings(user.id);
      } catch (error) {
        this.logger.warn(`Failed to initialize notification settings for user ${user.id}`, { error });
      }
    } else {
      this.logger.log(`Existing user found for WeChat openId: ${wechatUserInfo.openId}`);
    }

    this.logger.log(`WeChat login successful for user: ${user.id}`);
    return this.createSessionAndTokens(user);
  }

  /**
   * Create session and generate tokens for a user
   */
  private async createSessionAndTokens(user: User): Promise<LoginResponseDto> {
    const hash = this.tokenService.generateSessionHash();

    const session = await this.sessionService.create({
      user,
      hash,
    });

    const { token, refreshToken, tokenExpires } = await this.tokenService.getTokensData({
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
}
