/* @flow */

function createStringData(id: string, value: string): Instruction {

  return {
    name: '',
    left: `{ b "${value}", b 0 }`,
    result: id,
    isData: true,
    isGlobal: true,
  };
}

function createLocalNumberData(id: string, value: string): Instruction {

  return {
    type: 'w',
    name: 'copy',
    left: value,
    result: id,
  };
}

module.exports = {createStringData, createLocalNumberData};
