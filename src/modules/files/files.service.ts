import { Injectable } from '@nestjs/common';

import { FileRepository } from './infrastructure/persistence/file.repository';
import { FileType } from './domain/file';
import { NullableType } from '../../common/types/nullable.type';

/**
 * 文件服务 - 管理文件元数据
 */
@Injectable()
export class FilesService {
  constructor(private readonly fileRepository: FileRepository) {}

  /**
   * 根据ID查找文件
   * @param id - 文件ID
   * @returns 文件对象或 null
   */
  findById(id: FileType['id']): Promise<NullableType<FileType>> {
    return this.fileRepository.findById(id);
  }

  /**
   * 根据ID列表批量查找文件
   * @param ids - 文件ID列表
   * @returns 文件对象列表
   */
  findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    return this.fileRepository.findByIds(ids);
  }
}
