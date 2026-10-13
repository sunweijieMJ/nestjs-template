# Command Line Interface (CLI)

---

## Table of Contents <!-- omit in toc -->

- [Generate resource](#generate-resource)
  - [For relational database (PostgreSQL + TypeORM)](#for-relational-database-postgresql--typeorm)
    - [Video guideline for relational database (PostgreSQL + TypeORM)](#video-guideline-for-relational-database-postgresql--typeorm)
- [Add property to resource](#add-property-to-resource)
  - [Property for relational database (PostgreSQL + TypeORM)](#property-for-relational-database-postgresql--typeorm)
    - [Video guideline how to add property for relational database (PostgreSQL + TypeORM)](#video-guideline-how-to-add-property-for-relational-database-postgresql--typeorm)

---

## Generate resource

Generate resource with the following commands. The resource is created in `src/modules/<resource-names>/` (pluralized and kebab-cased, e.g. `Category` → `src/modules/categories/`) and registered in `src/app.module.ts`.

### For relational database (PostgreSQL + TypeORM)

```bash
pnpm generate:resource:relational --name ResourceName
```

Example:

```bash
pnpm generate:resource:relational --name Category
```

#### Video guideline for relational database (PostgreSQL + TypeORM)

<https://github.com/user-attachments/assets/f7f91a7d-f9ff-4653-a78a-152ac5e7a95d>

## Add property to resource

### Property for relational database (PostgreSQL + TypeORM)

```bash
pnpm add:property:to-relational
```

#### Video guideline how to add property for relational database (PostgreSQL + TypeORM)

<https://github.com/user-attachments/assets/95b9d70a-70cf-442a-b8bf-a73d32810e0c>

---

Previous: [Architecture](architecture.md)

Next: [Database](database.md)
