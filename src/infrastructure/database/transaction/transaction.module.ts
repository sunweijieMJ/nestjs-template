import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransactionService } from './transaction.service';
import { TransactionInterceptor } from './transaction.interceptor';

/**
 * TransactionModule provides transaction support for the application.
 * It exports TransactionService which can be injected into any service
 * to execute operations within a database transaction.
 *
 * The module also registers TransactionInterceptor globally to support
 * the @Transactional() decorator on controller methods.
 *
 * @example
 * Using TransactionService directly:
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private transactionService: TransactionService) {}
 *
 *   async createUserWithProfile(dto: CreateUserDto) {
 *     return this.transactionService.run(async (manager) => {
 *       const user = await manager.save(User, dto);
 *       await manager.save(Profile, { userId: user.id });
 *       return user;
 *     });
 *   }
 * }
 * ```
 *
 * @example
 * Using @Transactional() decorator:
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Post()
 *   @Transactional()
 *   async createUser(@Body() dto: CreateUserDto) {
 *     // This entire method runs in a transaction
 *     return this.userService.create(dto);
 *   }
 * }
 * ```
 */
@Global()
@Module({
  providers: [
    TransactionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransactionInterceptor,
    },
  ],
  exports: [TransactionService],
})
export class TransactionModule {}
