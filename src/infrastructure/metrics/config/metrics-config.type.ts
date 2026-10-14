export type MetricsConfig = {
  enabled: boolean;
  path: string;
  /** 访问指标端点所需的 Bearer 令牌 */
  token?: string;
  defaultLabels: Record<string, string>;
};
