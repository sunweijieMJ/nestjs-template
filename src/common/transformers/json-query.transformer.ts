import { plainToInstance } from 'class-transformer';
import { ClassConstructor, TransformFnParams } from 'class-transformer/types/interfaces';

/**
 * 解析查询字符串中的 JSON 参数为指定类的实例；JSON 非法时原样返回字符串，交给后续校验报 422
 */
export const jsonQueryTransformer =
  <T>(cls: ClassConstructor<T>) =>
  ({ value }: TransformFnParams): unknown => {
    if (!value) {
      return undefined;
    }
    try {
      return plainToInstance(cls, JSON.parse(value));
    } catch {
      return value;
    }
  };

export const sortOrderTransformer = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;
