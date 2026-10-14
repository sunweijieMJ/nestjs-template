import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryUserDto } from '../../core/users/dto/query-user.dto';
import { QueryAddressDto } from '../../modules/addresses/dto/query-address.dto';

async function invalidProperties(cls: new () => object, query: Record<string, string>): Promise<string[]> {
  const errors = await validate(plainToInstance(cls, query));
  return errors.map((error) => error.property);
}

describe('JSON query parameters', () => {
  it('should accept a whitelisted sort and normalise the direction', async () => {
    const dto = plainToInstance(QueryUserDto, { sort: '[{"orderBy":"createdAt","order":"desc"}]' });
    expect(dto.sort?.[0].order).toBe('DESC');
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it.each([
    ['malformed JSON', 'abc'],
    ['an object instead of an array', '{"orderBy":"createdAt","order":"ASC"}'],
    ['a field outside the whitelist', '[{"orderBy":"password","order":"ASC"}]'],
    ['an unknown direction', '[{"orderBy":"createdAt","order":"x"}]'],
  ])('should reject a sort with %s', async (_label, sort) => {
    await expect(invalidProperties(QueryUserDto, { sort })).resolves.toEqual(['sort']);
    await expect(invalidProperties(QueryAddressDto, { sort })).resolves.toEqual(['sort']);
  });

  it('should reject malformed filters', async () => {
    await expect(invalidProperties(QueryAddressDto, { filters: '{bad' })).resolves.toEqual(['filters']);
  });
});
