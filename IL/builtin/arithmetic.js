/* @flow */
const {generateGlobalIdentifier} = require('../../utils');

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

function createOperation(operator: string, left: string, right: string) {

  switch (operator) {
  case '+':
    return add(left, right);
  case '-':
    return sub(left, right);
  case '/':
    return div(left, right);
  case '*':
    return mul(left, right);
  }
}

module.exports = {createOperation};
