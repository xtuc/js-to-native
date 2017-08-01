/* @flow */
const {createLocalNumberData} = require('../variable');
const {generateGlobalIdentifier} = require('../../utils');

function maxNumber(): [Instruction] {
  const id = generateGlobalIdentifier();

  return createLocalNumberData(id, '9223372036854775807');
}

function negateNumber(value: number): Instruction {
  const result = generateGlobalIdentifier();

  return {
    name: 'sub',
    type: 'w',
    left: '0',
    right: '' + value,
    result,
  };
}

module.exports = {maxNumber, negateNumber};
