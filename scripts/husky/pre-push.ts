import { execSync } from 'child_process';
import chalk from 'chalk';

async function main() {
  try {
    // 构建检查
    console.log(chalk.blue('正在进行构建检查...'));
    execSync('npm run build', { stdio: 'inherit' });
    console.log(chalk.green('✓ 构建检查通过\n'));

    console.log(chalk.green.bold('✓ 所有 pre-push 检查通过'));
    process.exit(0);
  } catch (error) {
    console.error(chalk.red.bold('\n✗ Pre-push 检查失败'));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
    process.exit(1);
  }
}

main().catch(console.error);
