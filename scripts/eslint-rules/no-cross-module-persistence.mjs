import path from 'node:path';

const MODULE_PATTERN = /^src\/(core|modules)\/([^/]+)\//;
const PERSISTENCE_SEGMENT = '/infrastructure/persistence/';
const RELATIONAL_SEGMENT = '/infrastructure/persistence/relational/';
const RELATIONAL_SHARED_PATTERN = /\/infrastructure\/persistence\/relational\/(entities|mappers)\//;

const toPosix = (p) => p.split(path.sep).join('/');

const moduleOf = (relativePath) => {
  const match = MODULE_PATTERN.exec(relativePath);
  return match ? `${match[1]}/${match[2]}` : null;
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description: '禁止跨模块引用其他模块 infrastructure/persistence 下的内部实现',
    },
    schema: [],
    messages: {
      crossModule: '禁止引用 {{target}} 模块的持久化实现。请通过该模块 Module exports 暴露的 Service 访问数据。',
    },
  },
  create(context) {
    const cwd = context.cwd;
    const filename = toPosix(path.relative(cwd, context.filename));
    const ownModule = moduleOf(filename);
    const inRelationalLayer = filename.includes(RELATIONAL_SEGMENT);

    const check = (node, source) => {
      if (typeof source !== 'string' || !source.startsWith('.')) return;

      const resolved = toPosix(path.relative(cwd, path.resolve(path.dirname(context.filename), source)));
      if (!resolved.includes(PERSISTENCE_SEGMENT)) return;

      const targetModule = moduleOf(resolved);
      if (!targetModule || targetModule === ownModule) return;
      if (inRelationalLayer && RELATIONAL_SHARED_PATTERN.test(resolved)) return;

      context.report({ node, messageId: 'crossModule', data: { target: targetModule } });
    };

    const checkLiteral = (node, arg) => {
      if (arg?.type === 'Literal') check(node, arg.value);
    };

    return {
      ImportDeclaration: (node) => check(node, node.source.value),
      ExportNamedDeclaration: (node) => node.source && check(node, node.source.value),
      ExportAllDeclaration: (node) => check(node, node.source.value),
      ImportExpression: (node) => checkLiteral(node, node.source),
      TSImportEqualsDeclaration: (node) =>
        node.moduleReference.type === 'TSExternalModuleReference' &&
        checkLiteral(node, node.moduleReference.expression),
      'CallExpression[callee.type="Identifier"][callee.name="require"]': (node) =>
        checkLiteral(node, node.arguments[0]),
    };
  },
};
