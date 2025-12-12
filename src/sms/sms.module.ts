import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { AliyunSmsProvider } from './providers/aliyun-sms.provider';

@Module({
  providers: [SmsService, AliyunSmsProvider],
  exports: [SmsService],
})
export class SmsModule {}
