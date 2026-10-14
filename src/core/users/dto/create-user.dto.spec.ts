import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';

const MD5 = 'e10adc3949ba59abbe56e057f20f883e';

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
