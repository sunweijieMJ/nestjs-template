const S3_ENV = {
  FILE_DRIVER: 's3',
  ACCESS_KEY_ID: 'key',
  SECRET_ACCESS_KEY: 'secret',
  AWS_DEFAULT_S3_BUCKET: 'bucket',
  AWS_S3_REGION: 'oss-cn-hangzhou',
  AWS_S3_ENDPOINT: 'https://oss-cn-hangzhou.aliyuncs.com',
};

async function signedUrl(env: Record<string, string>): Promise<URL> {
  Object.assign(process.env, env);
  let plain: Record<string, unknown> = {};
  jest.isolateModules(() => {
    const { FileType } = jest.requireActual<typeof import('./file')>('./file');
    const { instanceToPlain, plainToInstance } =
      jest.requireActual<typeof import('class-transformer')>('class-transformer');
    plain = instanceToPlain(plainToInstance(FileType, { id: '1', path: 'a/b.png' }));
  });
  return new URL(await (plain.path as Promise<string>));
}

describe('FileType', () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it('should sign path-style URLs against the configured endpoint by default', async () => {
    const url = await signedUrl(S3_ENV);

    expect(url.origin).toBe('https://oss-cn-hangzhou.aliyuncs.com');
    expect(url.pathname).toBe('/bucket/a/b.png');
  });

  it('should sign virtual-hosted URLs when path style is disabled', async () => {
    const url = await signedUrl({ ...S3_ENV, AWS_S3_FORCE_PATH_STYLE: 'false' });

    expect(url.origin).toBe('https://bucket.oss-cn-hangzhou.aliyuncs.com');
    expect(url.pathname).toBe('/a/b.png');
  });
});
