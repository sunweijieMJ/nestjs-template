---
to: src/modules/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>.service.ts
---
import {
  // common
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Create<%= name %>Dto } from './dto/create-<%= h.inflection.transform(name, ['underscore', 'dasherize']) %>.dto';
import { Update<%= name %>Dto } from './dto/update-<%= h.inflection.transform(name, ['underscore', 'dasherize']) %>.dto';
import { <%= name %>Repository } from './infrastructure/persistence/<%= h.inflection.transform(name, ['underscore', 'dasherize']) %>.repository';
import { IPaginationOptions } from '../../common/types/pagination-options';
import { NullableType } from '../../common/types/nullable.type';
import { <%= name %> } from './domain/<%= h.inflection.transform(name, ['underscore', 'dasherize']) %>';

@Injectable()
export class <%= h.inflection.transform(name, ['pluralize']) %>Service {
  constructor(
    // Dependencies here
    private readonly <%= h.inflection.camelize(name, true) %>Repository: <%= name %>Repository,
  ) {}

  async create(create<%= name %>Dto: Create<%= name %>Dto): Promise<<%= name %>> {
    void create<%= name %>Dto;
    // Do not remove comment below.
    // <creating-property />

    return this.<%= h.inflection.camelize(name, true) %>Repository.create({
      // Do not remove comment below.
      // <creating-property-payload />
    });
  }

  async findManyWithPaginationAndCount({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<{ data: <%= name %>[]; total: number }> {
    return this.<%= h.inflection.camelize(name, true) %>Repository.findManyWithPaginationAndCount({ paginationOptions });
  }

  findById(id: <%= name %>['id']): Promise<NullableType<<%= name %>>> {
    return this.<%= h.inflection.camelize(name, true) %>Repository.findById(id);
  }

  findByIds(ids: <%= name %>['id'][]): Promise<<%= name %>[]> {
    return this.<%= h.inflection.camelize(name, true) %>Repository.findByIds(ids);
  }

  async findOne(id: <%= name %>['id']): Promise<<%= name %>> {
    const entity = await this.<%= h.inflection.camelize(name, true) %>Repository.findById(id);
    if (!entity) {
      throw new NotFoundException({ error: '<%= h.inflection.camelize(name, true) %>NotFound' });
    }
    return entity;
  }

  async update(id: <%= name %>['id'], update<%= name %>Dto: Update<%= name %>Dto): Promise<<%= name %>> {
    await this.findOne(id);
    void update<%= name %>Dto;
    // Do not remove comment below.
    // <updating-property />

    const updated = await this.<%= h.inflection.camelize(name, true) %>Repository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
    });
    if (!updated) {
      throw new NotFoundException({ error: '<%= h.inflection.camelize(name, true) %>NotFound' });
    }
    return updated;
  }

  async remove(id: <%= name %>['id']): Promise<void> {
    const removed = await this.<%= h.inflection.camelize(name, true) %>Repository.remove(id);
    if (!removed) {
      throw new NotFoundException({ error: '<%= h.inflection.camelize(name, true) %>NotFound' });
    }
  }
}
