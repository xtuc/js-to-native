/* @flow */
const {generateGlobalIdentifier} = require('../../utils');

function copyLocal(id: string): Instruction {
  const result = generateGlobalIdentifier();

  return {
    type: 'w',
    name: 'copy',
    left: id,
    result,
  };
}

function loadLocal(id: string): Instruction {
  const result = generateGlobalIdentifier();
  const type = 'w'

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
    type: 'w',
    name: 'add',
    left,
    right,
    result: id,
  };
}

function sub(left: string, right: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'w',
    name: 'sub',
    left,
    right,
    result: id,
  };
}

function div(left: string, right: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'w',
    name: 'div',
    left,
    right,
    result: id,
  };
}

function mul(left: string, right: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'w',
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
    throw new Error('Unsupported operation');
  }

  return [
    loadLeft,
    loadRight,
    op,
  ];
}

module.exports = {createOperation};
