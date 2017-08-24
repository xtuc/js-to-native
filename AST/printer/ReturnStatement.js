const t = require('babel-types');

const IL = require('../../IL');
const {panic, generateGlobalIdentifier} = require('../../utils');

module.exports = function(path, {isMain, code}) {
  const appendInstructions = (isMain
    ? code.appendMainInstructions
    : code.appendInstructions).bind(code);

  const {argument} = path.node;
  const id = generateGlobalIdentifier();

  let retValue = 0;

  if (t.isBinaryExpression(argument)) {
    const {left, right, operator} = argument;

    if (t.isIdentifier(left)) {
      left.value = '%' + left.name;
    }

    if (t.isIdentifier(right)) {
      right.value = '%' + right.name;
    }

    // It's a comparaison
    if (operator === '===') {
      appendInstructions([
        IL.comparisons.createStrictComparaison(id, left.value, right.value),
      ]);

      retValue = '%' + id;
    } else {
      panic('Not supported', argument.loc);
    }
  } else if (t.isNumericLiteral(argument)) {
    retValue = argument.value;
  }

  appendInstructions([
    IL.functions.ret(retValue),
  ]);

  path.skip();
};
