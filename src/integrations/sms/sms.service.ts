import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
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

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly MAX_ATTEMPTS = 5;
  private readonly RESEND_INTERVAL = 60; // seconds

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly aliyunSmsProvider: AliyunSmsProvider,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Generate a random verification code
   */
  private generateCode(): string {
    const length = this.configService.get('sms.codeLength', { infer: true }) ?? 6;
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  /**
   * Get cache key for verification code
   */
  private getCacheKey(phone: string, type: SmsCodeType): string {
    return `sms:code:${type}:${phone}`;
  }

  /**
   * Send verification code to phone number
   */
  async sendCode(phone: string, type: SmsCodeType): Promise<SendCodeResult> {
    const cacheKey = this.getCacheKey(phone, type);
    const existing = await this.cacheManager.get<StoredCode>(cacheKey);

    // Check if code was sent recently
    if (existing) {
      const elapsed = (Date.now() - existing.createdAt) / 1000;
      if (elapsed < this.RESEND_INTERVAL) {
        const retryAfter = Math.ceil(this.RESEND_INTERVAL - elapsed);
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
   * Verify the code entered by user
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

    // Check attempts
    if (stored.attempts >= this.MAX_ATTEMPTS) {
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
   * Check if a code exists for the given phone and type
   */
  async hasActiveCode(phone: string, type: SmsCodeType): Promise<boolean> {
    const cacheKey = this.getCacheKey(phone, type);
    const stored = await this.cacheManager.get<StoredCode>(cacheKey);
    return !!stored;
  }

  /**
   * Delete verification code (e.g., after successful registration/login)
   */
  async deleteCode(phone: string, type: SmsCodeType): Promise<void> {
    const cacheKey = this.getCacheKey(phone, type);
    await this.cacheManager.del(cacheKey);
  }
}
