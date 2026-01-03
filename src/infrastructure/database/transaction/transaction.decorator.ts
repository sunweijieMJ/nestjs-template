import { SetMetadata } from '@nestjs/common';

export const TRANSACTIONAL_KEY = 'transactional';

/**
 * Decorator to mark a method as transactional.
 * When applied, the method will be wrapped in a database transaction.
 * If the method throws an error, the transaction will be rolled back.
 *
 * @example
 * ```typescript
 * @Transactional()
 * async createUserWithProfile(dto: CreateUserDto): Promise<User> {
 *   const user = await this.userRepository.create(dto);
 *   await this.profileRepository.create({ userId: user.id });
 *   return user;
 * }
 * ```
 */
export const Transactional = (): MethodDecorator => SetMetadata(TRANSACTIONAL_KEY, true);
