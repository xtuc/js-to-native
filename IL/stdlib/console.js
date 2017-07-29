/* @flow */
const {generateGlobalIdentifier} = require('../../utils');

function logNumber(value: string): [Instruction] {
  const id = generateGlobalIdentifier();

  return [{
    type: 'w',
    name: 'copy',
    left: value,
    result: id,
  }, {
    name: 'call',
    left: `$printf(l $integerFmt, w %${id})`,
  }];
}

function logIdentifierString(id: string): [Instruction] {
  return [{
    name: 'call',
    left: `$printf(l $stringFmt, w ${id})`,
  }];
}

function logIdentifierNumber(id: string, scope?: string = '$'): [Instruction] {

  return [{
    name: 'call',
    left: `$printf(l $integerFmt, w ${scope}${id})`,
  }];
}

module.exports = {logNumber, logIdentifierNumber, logIdentifierString};
