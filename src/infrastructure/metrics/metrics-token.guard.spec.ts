import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetricsTokenGuard } from './metrics-token.guard';

function guard(config: Record<string, string | undefined>): MetricsTokenGuard {
  return new MetricsTokenGuard({ get: (key: string) => config[key] } as unknown as ConfigService);
}

function context(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) }),
  } as unknown as ExecutionContext;
}

describe('MetricsTokenGuard', () => {
  const TOKEN = '0123456789abcdef';

  it('should require the configured bearer token', () => {
    const configured = guard({ 'metrics.token': TOKEN, 'app.nodeEnv': 'production' });
    expect(configured.canActivate(context(`Bearer ${TOKEN}`))).toBe(true);
    expect(configured.canActivate(context(`bearer ${TOKEN}`))).toBe(true);
    expect(configured.canActivate(context(`Basic ${TOKEN}`))).toBe(false);
    expect(configured.canActivate(context('Bearer wrong'))).toBe(false);
    expect(configured.canActivate(context())).toBe(false);
  });

  it('should deny access in production when no token is configured', () => {
    expect(guard({ 'app.nodeEnv': 'production' }).canActivate(context())).toBe(false);
  });

  it('should allow access outside production when no token is configured', () => {
    expect(guard({ 'app.nodeEnv': 'development' }).canActivate(context())).toBe(true);
  });
});
