import { NullableType } from '../../../../common/types/nullable.type';
import { Config } from '../../domain/config';

export abstract class AppConfigRepository {
  abstract findByKey(key: string): Promise<NullableType<Config>>;

  abstract upsert(key: string, value: Record<string, unknown>): Promise<Config>;
}
