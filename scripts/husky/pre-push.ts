import { execSync } from 'child_process';
import chalk from 'chalk';

try {
  console.log(chalk.blue('正在进行构建检查...'));
  execSync('pnpm build', { stdio: 'inherit' });
  console.log(chalk.green('✓ 构建检查通过'));
} catch (error) {
  console.error(chalk.red.bold('✗ Pre-push 检查失败'));
  if (error instanceof Error) {
    console.error(chalk.red(error.message));
  }
  process.exit(1);
}
