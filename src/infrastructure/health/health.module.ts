import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis.health';
import { WechatApiHealthIndicator } from './indicators/wechat-api.health';
import { AlipayApiHealthIndicator } from './indicators/alipay-api.health';
import { DatabasePoolHealthIndicator } from './indicators/database-pool.health';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TerminusModule, ConfigModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, WechatApiHealthIndicator, AlipayApiHealthIndicator, DatabasePoolHealthIndicator],
})
export class HealthModule {}
