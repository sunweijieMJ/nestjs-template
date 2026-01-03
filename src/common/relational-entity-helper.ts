import { instanceToPlain } from 'class-transformer';
import { AfterLoad, BaseEntity } from 'typeorm';

export class EntityRelationalHelper extends BaseEntity {
  __entity?: string;

  @AfterLoad()
  setEntityName(): void {
    this.__entity = this.constructor.name;
  }

  toJSON(): Record<string, unknown> {
    return instanceToPlain(this);
  }
}
