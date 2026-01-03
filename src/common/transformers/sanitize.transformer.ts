import { TransformFnParams } from 'class-transformer/types/interfaces';
import { MaybeType } from '../types/maybe.type';

/**
 * Sanitizes input by removing HTML tags and trimming whitespace.
 * Helps prevent XSS attacks from user input.
 */
export const sanitizeTransformer = (params: TransformFnParams): MaybeType<string> => {
  if (typeof params.value !== 'string') {
    return params.value;
  }

  return params.value
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .trim();
};
