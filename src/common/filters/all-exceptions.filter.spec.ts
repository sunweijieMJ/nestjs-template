import {
  ArgumentsHost,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { I18nContext } from 'nestjs-i18n';
import { AllExceptionsFilter } from './all-exceptions.filter';

const TRANSLATIONS: Record<string, string> = {
  'common.favoriteNotFound': '收藏不存在',
  'common.unauthorized': '未授权',
  'common.forbidden': '禁止访问',
  'common.conflict': '资源冲突',
};

function run(exception: unknown): { body: { code: number; message: unknown; data: unknown }; status: number } {
  const reply = jest.fn();
  const filter = new AllExceptionsFilter({
    httpAdapter: { reply, getRequestUrl: () => '/test' },
  } as unknown as HttpAdapterHost);
  const host = {
    switchToHttp: () => ({ getRequest: () => ({ headers: {} }), getResponse: () => ({}) }),
  } as unknown as ArgumentsHost;

  filter.catch(exception, host);

  const [, body, status] = reply.mock.calls[0];
  return { body, status };
}

describe('AllExceptionsFilter', () => {
  beforeEach(() => {
    jest.spyOn(I18nContext, 'current').mockReturnValue({
      t: (key: string) => TRANSLATIONS[key] ?? key,
    } as unknown as I18nContext<unknown>);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should translate the business error code into the message', () => {
    const { body, status } = run(new NotFoundException({ error: 'favoriteNotFound' }));
    expect(status).toBe(404);
    expect(body.message).toBe('收藏不存在');
  });

  it('should return the error code when it has no translation', () => {
    expect(run(new NotFoundException({ error: 'orderNotFound' })).body.message).toBe('orderNotFound');
  });

  it('should translate the default message of a built-in exception', () => {
    expect(run(new UnauthorizedException()).body.message).toBe('未授权');
  });

  it('should translate a built-in exception created with its default description', () => {
    expect(run(new ForbiddenException('Forbidden')).body.message).toBe('禁止访问');
    expect(run(new ConflictException()).body.message).toBe('资源冲突');
  });

  it('should keep a custom message of a built-in exception', () => {
    expect(run(new NotFoundException('Share not found')).body.message).toBe('Share not found');
  });
});
