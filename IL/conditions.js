/* @flow */
const {getFlowTypeAtPos, panic} = require('../utils');
const {
  unsignedGreaterOrEqualIntegers,
} = require('./comparisons');

function createCondition(t: Object, test: BabelASTNode): Instruction {
  const {left, right} = test;

  if (
    t.isBinaryExpression(test, {operator: '>='}) &&
    getFlowTypeAtPos(left.loc) === 'number' &&
    getFlowTypeAtPos(right.loc) === 'number'
  ) {

    if (t.isIdentifier(left)) {
      left.value = '%' + left.name;
    }

    return unsignedGreaterOrEqualIntegers(
      left.value,
      right.value
    );
  } else {
    return panic('Unsupported type', test.loc);
  }
}

module.exports = {createCondition};
