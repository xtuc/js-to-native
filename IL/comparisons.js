/* @flow */
const {generateGlobalIdentifier} = require('../utils');

function integerEqInteger(left: string, right: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'l',
    name: 'ceql',
    left,
    right,
    result: id,
  };
}

function stringEqString(lid: string, rid: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'w',
    name: 'call',
    left: `$isStringEqual(l ${lid}, l ${rid})`,
    result: id,
  };
}

function unsignedGreaterOrEqualIntegers(left: string, right: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'w',
    name: 'cugew',
    left,
    right,
    result: id,
  };
}

function signedGreaterOrEqualIntegers(left: string, right: string): Instruction {
  const id = generateGlobalIdentifier();

  return {
    type: 'l',
    name: 'cslel',
    left,
    right,
    result: id,
  };
}

function createStrictComparaison(name: string, left: string, right: string): Instruction {
  const res = integerEqInteger(left, right);

  // Rename result
  res.result = name;

  return res;
}

module.exports = {
  createStrictComparaison,

  integerEqInteger,
  stringEqString,
  unsignedGreaterOrEqualIntegers,
  signedGreaterOrEqualIntegers,
};
