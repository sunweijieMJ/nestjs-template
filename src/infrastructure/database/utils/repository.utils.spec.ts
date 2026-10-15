import { buildOrderParams } from './repository.utils';

describe('buildOrderParams', () => {
  const defaultOrder = { isDefault: 'DESC' as const, createdAt: 'DESC' as const };

  it('should use the default order without sort options', () => {
    expect(buildOrderParams(null, defaultOrder)).toEqual(defaultOrder);
  });

  it('should put sort options before the default order', () => {
    const order = buildOrderParams([{ orderBy: 'name', order: 'ASC' }], defaultOrder);

    expect(Object.entries(order)).toEqual([
      ['name', 'ASC'],
      ['isDefault', 'DESC'],
      ['createdAt', 'DESC'],
    ]);
  });

  it('should let a sort option override the default direction of the same field', () => {
    const order = buildOrderParams([{ orderBy: 'createdAt', order: 'ASC' }], defaultOrder);

    expect(Object.entries(order)).toEqual([
      ['createdAt', 'ASC'],
      ['isDefault', 'DESC'],
    ]);
  });
});
