import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * 创建 TypeORM DataSource 实例的工厂函数
 * 用于统一 DataSource 的初始化逻辑
 */
export async function dataSourceFactory(options?: DataSourceOptions): Promise<DataSource> {
  if (!options) {
    throw new Error('DataSourceOptions is required');
  }
  return new DataSource(options).initialize();
}
