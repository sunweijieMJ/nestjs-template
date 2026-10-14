---
to: src/modules/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>/dto/<%= h.inflection.transform(name, ['underscore', 'dasherize']) %>.dto.ts
---
import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class <%= name %>Dto {
  @ApiProperty({ type: Number })
  @IsInt()
  id: number;
}
