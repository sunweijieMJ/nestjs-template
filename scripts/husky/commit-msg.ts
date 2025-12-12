import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import chalk from 'chalk';

async function main() {
  // 获取提交信息文件路径
  const COMMIT_MESSAGE_FILE = process.argv[2];
  if (!COMMIT_MESSAGE_FILE) {
    console.error(chalk.red('✗ 没有提供 commit message 文件路径'));
    process.exit(1);
  }

  const COMMIT_MESSAGE = fs.readFileSync(COMMIT_MESSAGE_FILE, 'utf8').trim();

  // 跳过 merge commit 和 rebase
  if (
    COMMIT_MESSAGE.startsWith('Merge') ||
    COMMIT_MESSAGE.startsWith('Revert') ||
    COMMIT_MESSAGE.startsWith('fixup!') ||
    COMMIT_MESSAGE.startsWith('squash!')
  ) {
    console.log(chalk.yellow('跳过特殊提交类型的检查'));
    process.exit(0);
  }

  // 1. 格式验证
  const COMMIT_REGEXP =
    /^\[(AI|Human)\]\[(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)\]: .{1,100}/;

  if (!COMMIT_REGEXP.test(COMMIT_MESSAGE)) {
    console.error(
      `${chalk.bgRed.white(' 错误 ')} ${chalk.yellow('提交信息格式不正确！')}`,
    );
    console.error(
      chalk.yellow('\n请使用 ') +
        chalk.green('npm run commit') +
        chalk.yellow(' 来提交代码'),
    );
    console.error(chalk.yellow('\n或使用以下格式手动提交:'));
    console.error(chalk.cyan('  [AI][feat]: 添加新功能'));
    console.error(chalk.cyan('  [Human][fix]: 修复问题'));
    console.error(chalk.cyan('  [Human][docs]: 更新文档'));
    process.exit(1);
  }
  console.log(chalk.green('✓ 格式验证通过\n'));

  // 2. Cspell 拼写检查
  try {
    console.log(chalk.blue('正在进行拼写检查...'));
    const result = spawnSync('npx', ['--no-install', 'cspell', 'stdin'], {
      input: COMMIT_MESSAGE,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
      shell: true,
    });

    if (result.status !== 0) {
      console.error(chalk.red('✗ 拼写检查失败'));
      console.error(chalk.yellow('请修正提交信息中的拼写错误'));
      console.error(chalk.gray('错误输出:'), result.stderr || result.stdout);
      process.exit(1);
    }
    console.log(chalk.green('✓ 拼写检查通过\n'));
  } catch (error) {
    console.error(chalk.red('✗ 拼写检查执行失败:'), error);
    process.exit(1);
  }

  // 3. Commitlint 规范检查
  try {
    console.log(chalk.blue('正在进行 Commitlint 检查...'));
    execSync(`npx --no-install commitlint --edit ${COMMIT_MESSAGE_FILE}`, {
      stdio: 'inherit',
    });
    console.log(chalk.green('✓ Commitlint 检查通过\n'));
  } catch {
    console.error(chalk.red('✗ Commitlint 检查失败'));
    console.error(chalk.yellow('提示：请确保提交信息符合规范格式'));
    process.exit(1);
  }

  console.log(chalk.green.bold('✓ 所有 commit-msg 检查通过'));
  process.exit(0);
}

main().catch(console.error);
