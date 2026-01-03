import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import { AllConfigType } from '../../config/config.type';

export interface SendSmsResult {
  success: boolean;
  requestId?: string;
  bizId?: string;
  code?: string;
  message?: string;
}

@Injectable()
export class AliyunSmsProvider {
  private readonly logger = new Logger(AliyunSmsProvider.name);
  private client: Dysmsapi20170525 | null = null;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.initClient();
  }

  private initClient(): void {
    const accessKeyId = this.configService.get('sms.accessKeyId', { infer: true });
    const accessKeySecret = this.configService.get('sms.accessKeySecret', { infer: true });
    const endpoint = this.configService.get('sms.endpoint', { infer: true });
    const mockMode = this.configService.get('sms.mockMode', { infer: true });

    if (mockMode) {
      this.logger.warn('SMS is running in mock mode - messages will not be sent');
      return;
    }

    if (!accessKeyId || !accessKeySecret) {
      this.logger.warn('SMS credentials not configured - SMS sending will be disabled');
      return;
    }

    const config = new $OpenApi.Config({
      accessKeyId,
      accessKeySecret,
      endpoint: endpoint ?? 'dysmsapi.aliyuncs.com',
    });

    this.client = new Dysmsapi20170525(config);
  }

  /**
   * Send SMS message
   * @param phone Phone number (without country code for China)
   * @param templateParam Template parameters (e.g., { code: '123456' })
   * @returns Send result
   */
  async sendSms(phone: string, templateParam: Record<string, string>): Promise<SendSmsResult> {
    const signName = this.configService.get('sms.signName', { infer: true });
    const templateCode = this.configService.get('sms.templateCode', { infer: true });
    const mockMode = this.configService.get('sms.mockMode', { infer: true });

    // Mock mode - just log the message
    if (mockMode) {
      this.logger.log(`[MOCK SMS] To: ${phone}, Params: ${JSON.stringify(templateParam)}`);
      return {
        success: true,
        requestId: 'mock-request-id',
        bizId: 'mock-biz-id',
        code: 'OK',
        message: 'Mock SMS sent successfully',
      };
    }

    if (!this.client) {
      this.logger.error('SMS client not initialized');
      return {
        success: false,
        code: 'CLIENT_NOT_INITIALIZED',
        message: 'SMS client not initialized',
      };
    }

    if (!signName || !templateCode) {
      this.logger.error('SMS sign name or template code not configured');
      return {
        success: false,
        code: 'CONFIG_ERROR',
        message: 'SMS configuration incomplete',
      };
    }

    try {
      const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
        phoneNumbers: phone,
        signName,
        templateCode,
        templateParam: JSON.stringify(templateParam),
      });

      const response = await this.client.sendSms(sendSmsRequest);
      const body = response.body;

      if (!body) {
        this.logger.error('SMS response body is empty');
        return {
          success: false,
          code: 'EMPTY_RESPONSE',
          message: 'SMS response body is empty',
        };
      }

      if (body.code === 'OK') {
        this.logger.log(`SMS sent successfully to ${phone}, BizId: ${body.bizId}`);
        return {
          success: true,
          requestId: body.requestId,
          bizId: body.bizId,
          code: body.code,
          message: body.message,
        };
      } else {
        this.logger.error(`SMS send failed: ${body.code} - ${body.message}`);
        return {
          success: false,
          requestId: body.requestId,
          code: body.code,
          message: body.message,
        };
      }
    } catch (error) {
      this.logger.error(`SMS send error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        code: 'SEND_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
