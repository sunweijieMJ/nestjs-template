---
inject: true
to: src/app.module.ts
at_line: 0
skip_if: import { <%= h.inflection.transform(name, ['pluralize']) %>Module }
---
import { <%= h.inflection.transform(name, ['pluralize']) %>Module } from './modules/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>.module';