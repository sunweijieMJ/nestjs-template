import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AlipayService } from './alipay.service';
import alipayConfig from './config/alipay.config';

@Module({
  imports: [ConfigModule.forFeature(alipayConfig)],
  providers: [AlipayService],
  exports: [AlipayService],
})
export class AlipayModule {}
