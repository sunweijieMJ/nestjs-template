export type AlipayConfig = {
  /**
   * 支付宝应用 ID
   */
  appId: string;

  /**
   * 应用私钥（PKCS8 格式）
   */
  privateKey: string;

  /**
   * 支付宝公钥（用于验签）
   */
  alipayPublicKey: string;

  /**
   * 支付宝网关地址
   * 正式环境: https://openapi.alipay.com/gateway.do
   * 沙箱环境: https://openapi.alipaydev.com/gateway.do
   */
  gateway: string;

  /**
   * 签名类型
   * @default 'RSA2'
   */
  signType: 'RSA2' | 'RSA';

  /**
   * 字符集
   * @default 'utf-8'
   */
  charset: string;

  /**
   * 支付回调通知地址
   */
  notifyUrl: string;

  /**
   * 支付完成后跳转地址
   */
  returnUrl: string;

  /**
   * 是否使用沙箱环境
   * @default false
   */
  sandbox: boolean;
};
