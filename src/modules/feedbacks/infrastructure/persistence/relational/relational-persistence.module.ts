import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackEntity } from './entities/feedback.entity';
import { FeedbackRepository } from '../feedback.repository';
import { FeedbackRelationalRepository } from './repositories/feedback.repository';

@Module({
  imports: [TypeOrmModule.forFeature([FeedbackEntity])],
  providers: [
    {
      provide: FeedbackRepository,
      useClass: FeedbackRelationalRepository,
    },
  ],
  exports: [FeedbackRepository],
})
export class RelationalFeedbackPersistenceModule {}
