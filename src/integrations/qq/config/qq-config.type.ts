export type QqConfig = {
  // QQ互联 APP ID
  appId: string;
  // QQ互联 APP Key
  appKey: string;
  // QQ小程序
  miniAppId: string;
  miniAppSecret: string;
  // QQ钱包支付配置
  pay: {
    bargainorId: string; // 商户号
    appKey: string; // 支付应用密钥
    notifyUrl: string; // 支付回调地址
  };
};
