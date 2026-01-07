import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WechatService } from './wechat.service';
import { WechatPayService } from './wechat-pay.service';
import { WechatPayController } from './wechat-pay.controller';
import wechatConfig from './config/wechat.config';

@Module({
  imports: [ConfigModule.forFeature(wechatConfig)],
  controllers: [WechatPayController],
  providers: [WechatService, WechatPayService],
  exports: [WechatService, WechatPayService],
})
export class WechatModule {}
