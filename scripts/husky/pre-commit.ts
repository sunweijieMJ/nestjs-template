import { execSync } from 'child_process';
import chalk from 'chalk';

async function main() {
  try {
    // 1. Lint-staged 检查
    console.log(chalk.blue('正在执行 lint-staged...'));
    execSync('npx lint-staged', { stdio: 'inherit' });
    console.log(chalk.green('✓ Lint-staged 检查通过\n'));

    // 2. TypeScript 类型检查
    console.log(chalk.blue('正在进行 TypeScript 类型检查...'));
    execSync('npm run type-check', { stdio: 'inherit' });
    console.log(chalk.green('✓ TypeScript 类型检查通过\n'));

    // 3. 单元测试检查
    console.log(chalk.blue('正在运行单元测试...'));
    execSync('npm run test -- --passWithNoTests', { stdio: 'inherit' });
    console.log(chalk.green('✓ 单元测试通过\n'));

    console.log(chalk.green.bold('✓ 所有 pre-commit 检查通过'));
    process.exit(0);
  } catch (error) {
    console.error(chalk.red.bold('\n✗ Pre-commit 检查失败'));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
    process.exit(1);
  }
}

main().catch(console.error);
