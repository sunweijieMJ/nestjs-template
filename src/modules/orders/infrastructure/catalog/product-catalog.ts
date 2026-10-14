import { CatalogProduct } from '../../domain/catalog-product';

/** 下单定价来源，接入方需替换 OrdersModule 中的默认绑定 */
export abstract class ProductCatalog {
  /** 返回可售商品，不存在或不可售的 id 不出现在结果中 */
  abstract findByIds(ids: string[]): Promise<CatalogProduct[]>;
}
