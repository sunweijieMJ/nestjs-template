import { BadRequestException, HttpStatus, Injectable, PipeTransform } from '@nestjs/common';

/** 自增主键列为 int4 */
const MAX_ID = 2_147_483_647;

/** 将路径中的自增主键解析为正整数，超出 int4 范围或格式不对时返回 400 */
@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = Number(value);
    if (!/^\d+$/.test(value) || id < 1 || id > MAX_ID) {
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        errors: {
          id: 'invalidId',
        },
      });
    }
    return id;
  }
}
