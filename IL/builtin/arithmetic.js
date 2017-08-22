/* @flow */
const {generateGlobalIdentifier} = require('../../utils');

function copyLocal(id: string): Instruction {
  const result = generateGlobalIdentifier();

  return {
    type: 'l',
    name: 'copy',
    left: id,
    result,
  };
}

function loadLocal(id: string): Instruction {
  const result = generateGlobalIdentifier();
  const type = 'l';

  return {
    type,
    name: 'load' + type,
    left: id,
    result,
  };
}

function add(left: string, right: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'l',
    name: 'add',
    left,
    right,
    result: id,
  };
}

function sub(left: string, right: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'l',
    name: 'sub',
    left,
    right,
    result: id,
  };
}

function div(left: string, right: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'l',
    name: 'div',
    left,
    right,
    result: id,
  };
}

function mul(left: string, right: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'l',
    name: 'mul',
    left,
    right,
    result: id,
  };
}

function createOperation(operator: string, left: string, right: string): [Instruction] {
  let op;

  const loadLeft = left[0] === '%' ? loadLocal(left) : copyLocal(left);
  const loadRight = right[0] === '%' ? loadLocal(right) : copyLocal(right);

  switch (operator) {
  case '+':
    op = add('%' + loadLeft.result, '%' + loadRight.result);
    break;
  case '-':
    op = sub('%' + loadLeft.result, '%' + loadRight.result);
    break;
  case '/':
    op = div('%' + loadLeft.result, '%' + loadRight.result);
    break;
  case '*':
    op = mul('%' + loadLeft.result, '%' + loadRight.result);
    break;
  default:
    throw new Error('Unsupported operation: ' + operator);
  }

  return [
    loadLeft,
    loadRight,
    op,
  ];
}

module.exports = {createOperation, copyLocal};
