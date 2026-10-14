import { Injectable } from '@nestjs/common';
import { ProductCatalog } from './product-catalog';
import { CatalogProduct } from '../../domain/catalog-product';

@Injectable()
export class UnavailableProductCatalog implements ProductCatalog {
  findByIds(): Promise<CatalogProduct[]> {
    return Promise.resolve([]);
  }
}
