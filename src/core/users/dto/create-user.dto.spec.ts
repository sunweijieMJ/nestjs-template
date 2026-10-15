import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { QueryUserDto } from './query-user.dto';
import { AuthUpdateDto } from '../../auth/dto/auth-update.dto';

const MD5 = 'e10adc3949ba59abbe56e057f20f883e';
const FILE_ID = '3f0c8a52-7d0e-4b59-9f8e-2a1d6c4b7e10';

async function invalidProperties(cls: new () => object, plain: object): Promise<string[]> {
  const errors = await validate(plainToInstance(cls, plain), { whitelist: true });
  return errors.map((error) => error.property);
}

describe('CreateUserDto', () => {
  it('should accept an MD5 password and a known provider', async () => {
    await expect(invalidProperties(CreateUserDto, { password: MD5, provider: 'phone' })).resolves.toEqual([]);
  });

  it('should lower-case an MD5 password', () => {
    expect(plainToInstance(CreateUserDto, { password: MD5.toUpperCase() }).password).toBe(MD5);
  });

  it('should reject a plain password and an unknown provider', async () => {
    await expect(invalidProperties(CreateUserDto, { password: 'secret123', provider: 'x' })).resolves.toEqual([
      'password',
      'provider',
    ]);
  });
});

describe('UpdateUserDto', () => {
  it('should reject a plain password', async () => {
    await expect(invalidProperties(UpdateUserDto, { password: 'secret123' })).resolves.toEqual(['password']);
  });
});

describe.each([
  ['CreateUserDto', CreateUserDto],
  ['UpdateUserDto', UpdateUserDto],
  ['AuthUpdateDto', AuthUpdateDto],
])('%s photo', (_name, cls) => {
  it('should reject a photo id that is not a UUID', async () => {
    await expect(invalidProperties(cls, { photo: { id: 'abc' } })).resolves.toEqual(['photo']);
  });

  it('should accept a UUID photo id and null', async () => {
    await expect(invalidProperties(cls, { photo: { id: FILE_ID } })).resolves.toEqual([]);
    await expect(invalidProperties(cls, { photo: null })).resolves.toEqual([]);
  });
});

describe('QueryUserDto', () => {
  it.each(['0', '-1', '1.5'])('should reject page %s', async (page) => {
    await expect(invalidProperties(QueryUserDto, { page, limit: page })).resolves.toEqual(['page', 'limit']);
  });

  it('should treat empty page and limit as absent', async () => {
    await expect(invalidProperties(QueryUserDto, { page: '', limit: '' })).resolves.toEqual([]);
    expect(plainToInstance(QueryUserDto, { page: '', limit: '' })).toMatchObject({ page: undefined, limit: undefined });
  });

  it('should convert page and limit to numbers', () => {
    expect(plainToInstance(QueryUserDto, { page: '2', limit: '20' })).toMatchObject({ page: 2, limit: 20 });
  });
});
