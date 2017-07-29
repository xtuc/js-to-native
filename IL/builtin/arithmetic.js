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

  const load = left[0] === '%' ? loadLocal(left) : copyLocal(left);

  switch (operator) {
  case '+':
    op = add('%' + load.result, right);
    break;
  case '-':
    op = sub('%' + load.result, right);
    break;
  case '/':
    op = div('%' + load.result, right);
    break;
  case '*':
    op = mul('%' + load.result, right);
    break;
  default:
    throw 'Unsupported operation';
  }

  return [
    load,
    op,
  ];
}

module.exports = {createOperation};
