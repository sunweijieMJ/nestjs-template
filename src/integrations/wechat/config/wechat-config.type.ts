export type WechatConfig = {
  // 微信小程序
  miniAppId: string;
  miniAppSecret: string;
  // 微信开放平台（APP登录）
  appId: string;
  appSecret: string;
  // 微信支付配置
  pay: {
    mchId: string; // 商户号
    apiV3Key: string; // API v3 密钥
    serialNo: string; // 证书序列号
    privateKey: string; // 商户私钥
    notifyUrl: string; // 支付回调地址
  };
};
