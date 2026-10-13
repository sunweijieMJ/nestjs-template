/** @type {import('prettier').Config} */
export default {
  semi: true, // 在语句末尾添加分号
  singleQuote: true, // 使用单引号而不是双引号
  endOfLine: 'lf', // 统一使用 LF 行尾符
  printWidth: 120, // 设置每行代码的最大宽度为120个字符
  trailingComma: 'all', // 在多行对象、数组等的最后一项后添加逗号
  arrowParens: 'always', // 箭头函数单个参数也加括号
  bracketSpacing: true, // 在对象字面量的括号内添加空格
  tabWidth: 2, // 缩进使用2个空格
  useTabs: false, // 使用空格而不是制表符进行缩进
};
