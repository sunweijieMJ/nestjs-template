import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { MailModule } from '../../integrations/mail/mail.module';
import { SessionModule } from '../session/session.module';
import { UsersModule } from '../users/users.module';
import { SmsModule } from '../../integrations/sms/sms.module';
import { WechatModule } from '../../integrations/wechat/wechat.module';
import { AlipayModule } from '../../integrations/alipay/alipay.module';
import { TokenService } from './services/token.service';
import { NotificationsModule } from '../../modules/notifications/notifications.module';
import { RelationalAuthPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    UsersModule,
    SessionModule,
    PassportModule,
    MailModule,
    SmsModule,
    WechatModule,
    AlipayModule,
    JwtModule.register({}),
    RelationalAuthPersistenceModule,
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, TokenService],
  exports: [AuthService],
})
export class AuthModule {}
