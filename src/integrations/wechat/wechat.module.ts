import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WechatService } from './wechat.service';
import { WechatPayService } from './wechat-pay.service';
import { WechatPayController } from './wechat-pay.controller';
import wechatConfig from './config/wechat.config';
import { OrdersModule } from '../../modules/orders/orders.module';
import databaseConfig from '../../infrastructure/database/config/database.config';
import { DatabaseConfig } from '../../infrastructure/database/config/database-config.type';

const isDocumentDatabase = (databaseConfig() as DatabaseConfig).isDocumentDatabase;

@Module({
  imports: [ConfigModule.forFeature(wechatConfig), ...(isDocumentDatabase ? [] : [forwardRef(() => OrdersModule)])],
  controllers: [WechatPayController],
  providers: [WechatService, WechatPayService],
  exports: [WechatService, WechatPayService],
})
export class WechatModule {}
