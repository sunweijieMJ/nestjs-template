export type SmsConfig = {
  /**
   * Aliyun AccessKey ID
   */
  accessKeyId: string;

  /**
   * Aliyun AccessKey Secret
   */
  accessKeySecret: string;

  /**
   * SMS Sign Name (signature)
   */
  signName: string;

  /**
   * Template code for verification code
   */
  templateCode: string;

  /**
   * Verification code expiration time in seconds
   * @default 300 (5 minutes)
   */
  codeExpires: number;

  /**
   * Verification code length
   * @default 6
   */
  codeLength: number;

  /**
   * Endpoint region
   * @default 'cn-hangzhou'
   */
  endpoint: string;

  /**
   * Enable mock mode (for development)
   * When enabled, codes will be logged instead of sent
   */
  mockMode: boolean;

  /**
   * Maximum verification attempts before code is invalidated
   * @default 5
   */
  maxAttempts: number;

  /**
   * Minimum interval between code resend requests in seconds
   * @default 60
   */
  resendInterval: number;
};
