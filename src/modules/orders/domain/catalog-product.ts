export interface CatalogProduct {
  id: string;
  name: string;
  image?: string;
  /** 单价（分） */
  unitPrice: number;
}
