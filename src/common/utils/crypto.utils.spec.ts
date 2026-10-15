import { compareMd5Password, hashPassword } from './crypto.utils';

const MD5 = 'e10adc3949ba59abbe56e057f20f883e';

describe('compareMd5Password', () => {
  it('should match a password hashed from the lowercase MD5', async () => {
    await expect(compareMd5Password(MD5, await hashPassword(MD5))).resolves.toBe(true);
  });

  it('should match a password hashed from the uppercase MD5', async () => {
    await expect(compareMd5Password(MD5, await hashPassword(MD5.toUpperCase()))).resolves.toBe(true);
  });

  it('should reject a different password', async () => {
    await expect(compareMd5Password('5f4dcc3b5aa765d61d8327deb882cf99', await hashPassword(MD5))).resolves.toBe(false);
  });
});
