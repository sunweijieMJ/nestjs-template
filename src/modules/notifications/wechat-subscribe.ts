import { WechatSubscribeTemplate } from '../../integrations/wechat/config/wechat-config.type';
import { formatSubscribeValue } from '../../integrations/wechat/utils/subscribe-value.util';

/** 订阅消息场景，取值与 wechat.subscribeTemplates 的 key 一致 */
export enum WechatSubscribeScene {
  ORDER_PAID = 'orderPaid',
}

/** 写入通知 metadata、由队列发送的订阅消息参数 */
export interface WechatSubscribePayload {
  scene: WechatSubscribeScene;
  /** 已格式化的业务字段值，key 对应模板配置中的业务字段 */
  values: Record<string, string>;
  /** 点击消息跳转的小程序页面 */
  page: string;
}

export interface BuiltSubscribeMessage {
  templateId: string;
  page: string;
  data: Record<string, string>;
}

/**
 * 按模板配置把业务字段映射为模板字段，模板未配置时返回 null
 */
export function buildSubscribeMessage(
  payload: WechatSubscribePayload,
  template: WechatSubscribeTemplate | undefined,
): BuiltSubscribeMessage | null {
  if (!template?.templateId) {
    return null;
  }

  const data: Record<string, string> = {};
  for (const [field, key] of Object.entries(template.fields)) {
    const value = payload.values[field];
    if (value !== undefined) {
      data[key] = formatSubscribeValue(key, value);
    }
  }

  return { templateId: template.templateId, page: payload.page, data };
}
