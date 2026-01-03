import { CustomDecorator, SetMetadata } from '@nestjs/common';

export const SKIP_RESPONSE_TRANSFORM_KEY = 'skipResponseTransform';

/**
 * Decorator to skip the response transformation interceptor
 * Use this for endpoints that need to return raw responses (e.g., file downloads, redirects)
 *
 * @example
 * @Get('download')
 * @SkipResponseTransform()
 * download() {
 *   return streamFile();
 * }
 */
export const SkipResponseTransform = (): CustomDecorator<string> => SetMetadata(SKIP_RESPONSE_TRANSFORM_KEY, true);
