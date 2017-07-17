/* @flow */
const {generateGlobalIdentifier} = require('../utils');

function integerEqInteger(left: string, right: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'w',
    name: 'ceqw',
    left,
    right,
    result: id,
  };
}

function stringEqString(left: string, right: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'w',
    name: 'ceql',
    left,
    right,
    result: id,
  };
}

module.exports = {integerEqInteger, stringEqString};
