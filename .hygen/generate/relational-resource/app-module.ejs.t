---
inject: true
to: src/app.module.ts
after: imports
skip_if: <%= h.inflection.transform(name, ['pluralize']) %>Module,
---
    <%= h.inflection.transform(name, ['pluralize']) %>Module,