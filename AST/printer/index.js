const traverse = require('babel-traverse').default;
const CodeBuffer = require('../../buffer');

const visitor = {
  noScope: true,

  VariableDeclaration: require('./VariableDeclaration'),
  MemberExpression: require('./MemberExpression'),
  CallExpression: require('./CallExpression'),
  BinaryExpression: require('./BinaryExpression'),
  FunctionDeclaration: require('./FunctionDeclaration'),
  WhileStatement: require('./WhileStatement'),
  AssignmentExpression: require('./AssignmentExpression'),
  IfStatement: require('./IfStatement'),
};

module.exports = function Printer(ast) {
  const scope = null;
  const state = {code: new CodeBuffer, isMain: true};

  traverse(ast, visitor, scope, state);

  return {code: state.code.getWithMain()};
};

module.exports.visitor = visitor;
