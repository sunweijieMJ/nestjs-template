import authConfig from './auth.config';

const STRONG_SECRETS = {
  AUTH_JWT_SECRET: 'jwt_secret_0123456789abcdefghijklmnop',
  AUTH_REFRESH_SECRET: 'refresh_secret_0123456789abcdefghijklmnop',
  AUTH_FORGOT_SECRET: 'forgot_secret_0123456789abcdefghijklmnop',
  AUTH_CONFIRM_EMAIL_SECRET: 'confirm_secret_0123456789abcdefghijklmnop',
};

describe('authConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ...STRONG_SECRETS,
      AUTH_JWT_TOKEN_EXPIRES_IN: '15m',
      AUTH_REFRESH_TOKEN_EXPIRES_IN: '3650d',
      AUTH_FORGOT_TOKEN_EXPIRES_IN: '30m',
      AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN: '1d',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should accept short secrets outside production', () => {
    process.env.NODE_ENV = 'development';
    process.env.AUTH_JWT_SECRET = 'secret';

    expect((authConfig() as { secret?: string }).secret).toBe('secret');
  });

  it('should reject a missing secret outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.AUTH_JWT_SECRET;

    expect(() => authConfig()).toThrow('AUTH_JWT_SECRET');
  });

  it('should reject a short secret in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_JWT_SECRET = 'secret';

    expect(() => authConfig()).toThrow('AUTH_JWT_SECRET');
  });

  it('should reject identical secrets in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_REFRESH_SECRET = STRONG_SECRETS.AUTH_JWT_SECRET;

    expect(() => authConfig()).toThrow('must be different');
  });

  it('should accept long distinct secrets in production', () => {
    process.env.NODE_ENV = 'production';

    expect((authConfig() as { secret?: string }).secret).toBe(STRONG_SECRETS.AUTH_JWT_SECRET);
  });
});
