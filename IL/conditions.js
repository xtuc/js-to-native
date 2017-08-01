/* @flow */
const {generateGlobalIdentifier, getFlowTypeAtPos, panic} = require('../utils');
const {
  signedGreaterOrEqualIntegers,
  integerEqInteger,
} = require('./comparisons');
const {createLocalAssignement} = require('./variable');

function createConstantTrueCondition(): Instruction {
  return integerEqInteger('1', '1');
}

function createConstantFalseCondition(): Instruction {
  return integerEqInteger('0', '1');
}

function createCondition(t: Object, test: BabelASTNode): [Instruction] {
  const {left, right, operator} = test;

  if (
    getFlowTypeAtPos(left.loc) === 'number' &&
    getFlowTypeAtPos(right.loc) === 'number'
  ) {
    const res = [];

    if (t.isIdentifier(left)) {
      const id = generateGlobalIdentifier();
      const load = createLocalAssignement(id, '%' + left.name);

      res.push(load);

      left.value = '%' + id;
    }

    if (t.isUnaryExpression(left)) {
      left.value = left.operator + left.argument.value;
    }

    if (t.isUnaryExpression(right)) {
      right.value = right.operator + right.argument.value;
    }

    if (operator === '===') {

      res.push(
        integerEqInteger(left.value, right.value)
      );
    } else if (operator === '>=') {

      res.push(
        signedGreaterOrEqualIntegers(
          right.value,
          left.value,
        ),
      );
    }

    return res;

  } else if (t.isBooleanLiteral(test, {value: true})) {

    return createConstantTrueCondition();
  } else if (t.isBooleanLiteral(test, {value: false})) {
    // TODO(sven): we could actually remove the path

    return createConstantFalseCondition();
  } else {
    return panic('Unsupported type', test.loc);
  }
}

module.exports = {createCondition};
