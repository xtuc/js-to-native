/* @flow */
const {createLocalNumberData} = require('../variable');
const {generateGlobalIdentifier} = require('../../utils');

function maxNumber(): [Instruction] {
  const id = generateGlobalIdentifier();

  return createLocalNumberData(id, '9223372036854775807');
}

module.exports = {maxNumber};
