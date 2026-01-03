import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackSchemaClass, FeedbackSchema } from './entities/feedback.schema';
import { FeedbackRepository } from '../feedback.repository';
import { FeedbackDocumentRepository } from './repositories/feedback.repository';

@Module({
  imports: [MongooseModule.forFeature([{ name: FeedbackSchemaClass.name, schema: FeedbackSchema }])],
  providers: [
    {
      provide: FeedbackRepository,
      useClass: FeedbackDocumentRepository,
    },
  ],
  exports: [FeedbackRepository],
})
export class DocumentFeedbackPersistenceModule {}
