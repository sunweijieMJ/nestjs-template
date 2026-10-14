import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import checkFile from 'eslint-plugin-check-file';
import globals from 'globals';
import noCrossModulePersistence from './scripts/eslint-rules/no-cross-module-persistence.mjs';

const persistenceImpl = {
  group: [
    '**/infrastructure/persistence/relational/repositories/**',
    '**/infrastructure/persistence/relational/mappers/**',
  ],
  message:
    'Service 只能依赖抽象 Repository Port（infrastructure/persistence/*.repository.ts），不得引用具体 Repository 或 Mapper 实现。',
};

export default defineConfig(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'files/**', '.hygen/**'],
  },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Type safety rules - disabled as NestJS decorators handle type info
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': [
        'warn',
        {
          ignoreRestArgs: true,
          fixToUnknown: false,
        },
      ],

      // Strict null checks - disabled as TypeORM patterns commonly use non-null assertion
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Unused variables
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Async rules
      'require-await': 'off',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],

      // Safety rules - disabled due to third-party library type definitions
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',

      // Best practices
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/await-thenable': 'warn',

      // Safe to ignore - specific library usage patterns or intentional design
      '@typescript-eslint/unbound-method': 'off', // multerS3.AUTO_CONTENT_TYPE usage
      '@typescript-eslint/restrict-template-expressions': 'off', // logging unknown values is acceptable
      '@typescript-eslint/no-redundant-type-constituents': 'off', // OrNeverType is intentional design

      // Custom project rules
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.object.name=configService][callee.property.name=/^(get|getOrThrow)$/]:not(:has([arguments.1] Property[key.name=infer][value.value=true])), CallExpression[callee.object.property.name=configService][callee.property.name=/^(get|getOrThrow)$/]:not(:has([arguments.1] Property[key.name=infer][value.value=true]))',
          message:
            'Add "{ infer: true }" to configService.get() for correct typechecking. Example: configService.get("database.port", { infer: true })',
        },
        {
          selector: 'CallExpression[callee.name=it][arguments.0.value!=/^should/]',
          message: '"it" should start with "should"',
        },
      ],

      'no-console': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts', 'test/**/*.ts'],
    languageOptions: {
      globals: globals.vitest,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },

  // ==================== 架构护栏 ====================
  {
    files: ['src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'typeorm',
              message: 'Domain 实体不得依赖 TypeORM，持久化映射放在 infrastructure/persistence/relational。',
            },
            { name: '@nestjs/typeorm', message: 'Domain 实体不得依赖 TypeORM。' },
          ],
          patterns: [{ group: ['**/infrastructure/**'], message: 'Domain 层不得依赖 infrastructure 层。' }],
        },
      ],
    },
  },
  {
    files: ['src/**/*.service.ts', 'src/**/*.controller.ts'],
    ignores: ['src/infrastructure/database/seeds/**'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: '通过 ConfigService 读取配置：configService.get("xxx", { infer: true })。',
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.service.ts', 'src/modules/**/*.service.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [persistenceImpl] }],
    },
  },
  {
    files: ['src/**/*.ts'],
    ignores: ['src/infrastructure/database/**'],
    plugins: { local: { rules: { 'no-cross-module-persistence': noCrossModulePersistence } } },
    rules: {
      'local/no-cross-module-persistence': 'error',
    },
  },

  // ==================== 文件命名 ====================
  {
    files: ['src/**/*.ts', 'test/**/*.ts', 'scripts/**/*.ts'],
    ignores: ['src/infrastructure/database/migrations/**'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': ['error', { '**/*.ts': 'KEBAB_CASE' }, { ignoreMiddleExtensions: true }],
    },
  },

  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  eslintConfigPrettier,
);
