/* @flow */
const {generateGlobalIdentifier, getFlowTypeAtPos, panic} = require('../utils');
const {
  unsignedGreaterOrEqualIntegers,
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
  const {left, right} = test;

  if (
    t.isBinaryExpression(test, {operator: '>='}) &&
    getFlowTypeAtPos(left.loc) === 'number' &&
    getFlowTypeAtPos(right.loc) === 'number'
  ) {

    if (t.isIdentifier(left)) {
      const id = generateGlobalIdentifier();
      const load = createLocalAssignement(id, '%' + left.name);

      return [
        load,
        unsignedGreaterOrEqualIntegers(
          '%' + id,
          right.value,
        ),
      ];
    } else {

      return [
        unsignedGreaterOrEqualIntegers(
          left.value,
          right.value,
        ),
      ];

    }
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
