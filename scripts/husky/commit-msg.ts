import { execSync } from 'child_process';
import chalk from 'chalk';

const COMMIT_MESSAGE_FILE = process.argv[2];
if (!COMMIT_MESSAGE_FILE) {
  console.error(chalk.red('✗ 没有提供 commit message 文件路径'));
  process.exit(1);
}

try {
  execSync(`pnpm exec commitlint --edit "${COMMIT_MESSAGE_FILE}"`, { stdio: 'inherit' });
  console.log(chalk.green('✓ Commitlint 检查通过'));
} catch (error) {
  if ((error as { status?: number | null }).status !== 1) {
    console.error(chalk.red('✗ Commitlint 执行失败，请检查 pnpm 与 commitlint 配置是否可用'));
    process.exit(1);
  }
  console.error(`${chalk.bgRed.white(' 错误 ')} ${chalk.yellow('提交信息格式不正确！')}`);
  console.error(
    `${chalk.blue('正确格式:')} ${chalk.green('type: subject')} ${chalk.yellow('或')} ${chalk.green('type(scope): subject')}`,
  );
  console.error(
    `${chalk.blue('示例:')} ${chalk.green('feat: 添加用户登录功能')} ${chalk.yellow('或')} ${chalk.green('fix(auth): 修复登录验证问题')}`,
  );
  process.exit(1);
}
