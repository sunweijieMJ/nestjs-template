import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { SmsService, SmsCodeType, VerifyCodeResult } from '../../../integrations/sms/sms.service';
import { User } from '../../users/domain/user';
import { isUserStatusAllowedForAuth } from '../../../common/utils/status.util';
import { maskPhone } from '../../../common/utils/sanitize.utils';
import { Logger } from '@nestjs/common';

/**
 * 验证短信验证码
 * @param smsService - 短信服务实例
 * @param phone - 手机号
 * @param code - 验证码
 * @param type - 验证码类型
 * @param logger - 日志实例
 * @throws UnprocessableEntityException 当验证码无效时
 */
export async function verifySmsCode(
  smsService: SmsService,
  phone: string,
  code: string,
  type: SmsCodeType,
  logger?: Logger,
): Promise<VerifyCodeResult> {
  const verifyResult = await smsService.verifyCode(phone, code, type);
  if (!verifyResult.success) {
    logger?.warn(`SMS verification failed for: ${maskPhone(phone)}`);
    throw new UnprocessableEntityException({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      errors: {
        code: 'invalidCode',
      },
    });
  }
  return verifyResult;
}

/**
 * 验证用户状态是否允许认证
 * @param user - 用户对象
 * @param errorField - 错误字段名
 * @param logger - 日志实例
 * @throws UnprocessableEntityException 当用户状态不允许认证时
 */
export function validateUserStatusForAuth(user: User, errorField: string = 'email', logger?: Logger): void {
  if (!isUserStatusAllowedForAuth(user.status?.id)) {
    logger?.warn(`Auth failed - user status not allowed: ${user.id}, status: ${user.status?.id}`);
    throw new UnprocessableEntityException({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      errors: {
        [errorField]: 'userNotActive',
      },
    });
  }
}
