import { TransformFnParams } from 'class-transformer/types/interfaces';

/** 统一为小写，与登录时前端提交的 MD5 保持一致 */
export const md5PasswordTransformer = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.toLowerCase() : value;
