import { Module } from '@nestjs/common';
import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';
import { RelationalSharePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { WechatModule } from '../../integrations/wechat/wechat.module';
import { AlipayModule } from '../../integrations/alipay/alipay.module';

@Module({
  imports: [RelationalSharePersistenceModule, WechatModule, AlipayModule],
  controllers: [SharesController],
  providers: [SharesService],
  exports: [SharesService, RelationalSharePersistenceModule],
})
export class SharesModule {}
