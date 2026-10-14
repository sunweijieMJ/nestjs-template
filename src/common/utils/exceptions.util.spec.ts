import { HttpStatus } from '@nestjs/common';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  isUniqueViolation,
  isUniqueViolationOf,
  UNIQUE_CONSTRAINT_RESPONSES,
  uniqueViolationResponse,
} from './exceptions.util';

describe('isUniqueViolation', () => {
  it('should detect the PostgreSQL unique violation code', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
    expect(isUniqueViolation({ code: '22001' })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});

describe('uniqueViolationResponse', () => {
  it.each([
    [
      'UQ_e12875dfb3b1d92d7d7c5377e22',
      { status: HttpStatus.UNPROCESSABLE_ENTITY, errors: { email: 'emailAlreadyExists' } },
    ],
    ['user_phone_key', { status: HttpStatus.UNPROCESSABLE_ENTITY, errors: { phone: 'phoneAlreadyExists' } }],
    [
      'user_wechatOpenId_key',
      { status: HttpStatus.UNPROCESSABLE_ENTITY, errors: { wechatOpenId: 'wechatOpenIdAlreadyExists' } },
    ],
    ['REL_75e2be4ce11d447ef43be0e374', { status: HttpStatus.UNPROCESSABLE_ENTITY, errors: { photo: 'alreadyExists' } }],
    ['UQ_favorite_user_target', { status: HttpStatus.CONFLICT, error: 'alreadyFavorited' }],
    ['UQ_order_orderNo', { status: HttpStatus.INTERNAL_SERVER_ERROR }],
    ['UQ_share_shareCode', { status: HttpStatus.INTERNAL_SERVER_ERROR }],
    ['PK_config_key', { status: HttpStatus.CONFLICT }],
    ['UQ_notification_setting_userId_category', { status: HttpStatus.CONFLICT }],
    [undefined, { status: HttpStatus.CONFLICT }],
  ])('should map constraint %p', (constraint, expected) => {
    expect(uniqueViolationResponse(constraint)).toEqual(expected);
  });
});

describe('UNIQUE_CONSTRAINT_RESPONSES', () => {
  const migrations = readdirSync(join(__dirname, '../../infrastructure/database/migrations'))
    .map((file) => readFileSync(join(__dirname, '../../infrastructure/database/migrations', file), 'utf8'))
    .join('\n');
  const userEntity = readFileSync(
    join(__dirname, '../../core/users/infrastructure/persistence/relational/entities/user.entity.ts'),
    'utf8',
  );

  it.each(Object.keys(UNIQUE_CONSTRAINT_RESPONSES))('should name an existing constraint: %s', (constraint) => {
    const autoNamedByPostgres = ['user_phone_key', 'user_wechatOpenId_key'].includes(constraint);
    expect(autoNamedByPostgres ? userEntity : migrations).toContain(constraint);
  });

  it('should match a violation by constraint name', () => {
    expect(isUniqueViolationOf({ code: '23505', constraint: 'UQ_order_orderNo' }, 'UQ_order_orderNo')).toBe(true);
    expect(isUniqueViolationOf({ code: '23505', constraint: 'UQ_share_shareCode' }, 'UQ_order_orderNo')).toBe(false);
  });
});
