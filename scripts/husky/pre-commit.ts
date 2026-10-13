import { execSync } from 'child_process';
import chalk from 'chalk';

const log = {
  info: (msg: string) => console.log(chalk.blue(msg)),
  success: (msg: string) => console.log(chalk.green(`✓ ${msg}`)),
  warn: (msg: string) => console.log(chalk.yellow(msg)),
  error: (msg: string) => console.error(chalk.red(msg)),
};

try {
  const changedFiles = execSync('git diff --cached --name-only --diff-filter=ACMRD')
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean);

  if (!changedFiles.length) {
    log.warn('没有发现改动的文件，跳过检查');
    process.exit(0);
  }

  log.info('正在执行 lint-staged...');
  execSync('pnpm exec lint-staged', { stdio: 'inherit' });
  log.success('Lint-staged 检查通过');

  const needsTypeCheckAndTest = changedFiles.some(
    (file) =>
      /\.ts$/.test(file) ||
      /^src\/.*\.json$/.test(file) ||
      /(^|\/)tsconfig[^/]*\.json$/.test(file) ||
      file === 'package.json' ||
      file === 'pnpm-lock.yaml',
  );

  if (needsTypeCheckAndTest) {
    log.info('正在进行 TypeScript 类型检查...');
    execSync('pnpm type-check', { stdio: 'inherit' });
    log.success('TypeScript 类型检查通过');

    log.info('正在运行单元测试...');
    execSync('pnpm test', { stdio: 'inherit' });
    log.success('单元测试通过');
  } else {
    log.warn('改动不涉及 TypeScript 源码与依赖，跳过类型检查与单元测试');
  }
} catch (error) {
  log.error('✗ Pre-commit 检查失败');
  if (error instanceof Error) {
    log.error(error.message);
  }
  process.exit(1);
}
