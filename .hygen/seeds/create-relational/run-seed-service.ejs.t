---
inject: true
to: src/infrastructure/database/seeds/relational/run-seed.ts
before: close
---
  await app.get(<%= name %>SeedService).run();
