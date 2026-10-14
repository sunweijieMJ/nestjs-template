import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WechatService } from './wechat.service';
import { WechatPayService } from './wechat-pay.service';
import wechatConfig from './config/wechat.config';

@Module({
  imports: [ConfigModule.forFeature(wechatConfig)],
  providers: [WechatService, WechatPayService],
  exports: [WechatService, WechatPayService],
})
export class WechatModule {}
