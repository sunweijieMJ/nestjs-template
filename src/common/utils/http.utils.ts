import { Logger } from '@nestjs/common';

const logger = new Logger('HttpUtils');

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * 带重试机制的 HTTP 请求
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryOptions: RetryOptions = {},
): Promise<Response> {
  const { maxRetries = 3, retryDelay = 1000, timeout = 30000 } = retryOptions;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        logger.error(`Request failed after ${maxRetries + 1} attempts: ${url}`);
        throw error;
      }

      logger.warn(`Request attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error('Unexpected error in fetchWithRetry');
}
