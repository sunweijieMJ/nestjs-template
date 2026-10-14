---
inject: true
to: src/modules/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>.service.ts
before: from '@nestjs/common'
skip_if: UnprocessableEntityException,
---
<% if (kind === 'reference' || kind === 'duplication') { -%>
  UnprocessableEntityException,
<% } -%>