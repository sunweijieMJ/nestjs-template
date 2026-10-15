import { TransformFnParams } from 'class-transformer/types/interfaces';

/** 密码 MD5 统一为小写后再哈希或比对 */
export const md5PasswordTransformer = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.toLowerCase() : value;
