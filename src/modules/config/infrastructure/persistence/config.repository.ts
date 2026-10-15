import { NullableType } from '../../../../common/types/nullable.type';
import { Config } from '../../domain/config';

export abstract class AppConfigRepository {
  abstract findByKey(key: string): Promise<NullableType<Config>>;

  /** isPublic 为 undefined 时新建为 false，更新时保持原值 */
  abstract upsert(key: string, value: Record<string, unknown>, isPublic?: boolean): Promise<Config>;
}
