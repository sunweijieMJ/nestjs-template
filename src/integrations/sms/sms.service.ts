import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomInt } from 'crypto';
import { AllConfigType } from '../../config/config.type';
import { AliyunSmsProvider } from './providers/aliyun-sms.provider';

interface StoredCode {
  code: string;
  attempts: number;
  createdAt: number;
}

export enum SmsCodeType {
  LOGIN = 'login',
  REGISTER = 'register',
  RESET_PASSWORD = 'reset_password',
  CHANGE_PHONE = 'change_phone',
}

export interface SendCodeResult {
  success: boolean;
  message: string;
  /** Remaining seconds until code can be resent */
  retryAfter?: number;
}

export interface VerifyCodeResult {
  success: boolean;
  message: string;
}

/**
 * 短信服务 - 管理短信验证码的发送和验证
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly aliyunSmsProvider: AliyunSmsProvider,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * 生成加密安全的随机验证码
   * @returns 验证码字符串
   */
  private generateCode(): string {
    const length = this.configService.get('sms.codeLength', { infer: true }) ?? 6;
    let code = '';
    for (let i = 0; i < length; i++) {
      code += randomInt(0, 10).toString();
    }
    return code;
  }

  /**
   * 获取验证码的缓存键
   * @param phone - 手机号
   * @param type - 验证码类型
   * @returns 缓存键字符串
   */
  private getCacheKey(phone: string, type: SmsCodeType): string {
    return `sms:code:${type}:${phone}`;
  }

  /**
   * 发送短信验证码
   * @param phone - 手机号
   * @param type - 验证码类型
   * @returns 发送结果，包含成功状态、消息和重试时间
   */
  async sendCode(phone: string, type: SmsCodeType): Promise<SendCodeResult> {
    const cacheKey = this.getCacheKey(phone, type);
    const existing = await this.cacheManager.get<StoredCode>(cacheKey);

    const resendInterval = this.configService.get('sms.resendInterval', { infer: true }) ?? 60;

    // Check if code was sent recently
    if (existing) {
      const elapsed = (Date.now() - existing.createdAt) / 1000;
      if (elapsed < resendInterval) {
        const retryAfter = Math.ceil(resendInterval - elapsed);
        return {
          success: false,
          message: 'Please wait before requesting a new code',
          retryAfter,
        };
      }
    }

    // Generate new code
    const code = this.generateCode();
    const codeExpires = this.configService.get('sms.codeExpires', { infer: true }) ?? 300;

    // Send SMS
    const result = await this.aliyunSmsProvider.sendSms(phone, { code });

    if (!result.success) {
      this.logger.error(`Failed to send SMS to ${phone}: ${result.message}`);
      return {
        success: false,
        message: result.message ?? 'Failed to send verification code',
      };
    }

    // Store code in cache
    const storedCode: StoredCode = {
      code,
      attempts: 0,
      createdAt: Date.now(),
    };

    await this.cacheManager.set(cacheKey, storedCode, codeExpires * 1000);

    this.logger.log(`Verification code sent to ${phone} for ${type}`);

    return {
      success: true,
      message: 'Verification code sent successfully',
    };
  }

  /**
   * 验证用户输入的验证码
   * @param phone - 手机号
   * @param code - 用户输入的验证码
   * @param type - 验证码类型
   * @returns 验证结果，包含成功状态和消息
   */
  async verifyCode(phone: string, code: string, type: SmsCodeType): Promise<VerifyCodeResult> {
    const cacheKey = this.getCacheKey(phone, type);
    const stored = await this.cacheManager.get<StoredCode>(cacheKey);

    if (!stored) {
      return {
        success: false,
        message: 'Verification code expired or not found',
      };
    }

    const maxAttempts = this.configService.get('sms.maxAttempts', { infer: true }) ?? 5;

    // Check attempts
    if (stored.attempts >= maxAttempts) {
      await this.cacheManager.del(cacheKey);
      return {
        success: false,
        message: 'Too many failed attempts, please request a new code',
      };
    }

    // Verify code
    if (stored.code !== code) {
      // Increment attempts
      stored.attempts += 1;
      const codeExpires = this.configService.get('sms.codeExpires', { infer: true }) ?? 300;
      const remainingTtl = Math.max(0, codeExpires * 1000 - (Date.now() - stored.createdAt));

      if (remainingTtl > 0) {
        await this.cacheManager.set(cacheKey, stored, remainingTtl);
      }

      return {
        success: false,
        message: 'Invalid verification code',
      };
    }

    // Code is valid - delete it from cache
    await this.cacheManager.del(cacheKey);

    this.logger.log(`Verification code verified for ${phone} (${type})`);

    return {
      success: true,
      message: 'Verification code is valid',
    };
  }

  /**
   * 检查指定手机号和类型是否有活跃的验证码
   * @param phone - 手机号
   * @param type - 验证码类型
   * @returns 是否存在活跃验证码
   */
  async hasActiveCode(phone: string, type: SmsCodeType): Promise<boolean> {
    const cacheKey = this.getCacheKey(phone, type);
    const stored = await this.cacheManager.get<StoredCode>(cacheKey);
    return !!stored;
  }

  /**
   * 删除验证码（例如，在成功注册/登录后）
   * @param phone - 手机号
   * @param type - 验证码类型
   */
  async deleteCode(phone: string, type: SmsCodeType): Promise<void> {
    const cacheKey = this.getCacheKey(phone, type);
    await this.cacheManager.del(cacheKey);
  }
}
