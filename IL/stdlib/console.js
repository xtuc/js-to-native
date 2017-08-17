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
    left: `$printf(l $integerFmt, l %${id})`,
  }];
}

function logIdentifierString(id: string): [Instruction] {
  return [{
    name: 'call',
    left: `$printf(l $stringFmt, w ${id})`,
  }];
}

function logIdentifierNumber(
  id: string,
  scope?: string = '$',
  needLoad: boolean = false
): [Instruction] {
  let loadedAt = id;
  const res = [];

  if (needLoad === true) {
    const result = generateGlobalIdentifier();

    res.push({
      type: 'l',
      name: 'loadl',
      left: '%' + id,
      result,
    });

    loadedAt = result;
    scope = '%';
  }

  res.push({
    name: 'call',
    left: `$printf(l $integerFmt, l ${scope}${loadedAt})`,
  });

  return res;
}

module.exports = {logNumber, logIdentifierNumber, logIdentifierString};
