/* @flow */
const {generateGlobalIdentifier, getFlowTypeAtPos, panic} = require('../utils');
const {pointers} = require('./cache');
const {createOperation} = require('./builtin/arithmetic');

function createStringData(id: string, value: string): Instruction {

  return {
    name: '',
    left: `{ b "${value}", b 0 }`,
    result: id,
    isData: true,
    isGlobal: true,
  };
}

function createLocalNumberData(id: string, value: string): [Instruction] {

  return [{
    type: 'l',
    name: 'alloc4',
    left: '4',
    result: id,
  }, {
    type: '',
    name: 'storel',
    left: value,
    right: '%' + id,
  }];
}

function alloc4(id: string): Instruction {
  if (typeof id === "undefined") {
    throw new Error("Identifier cannot be null in alloc4");
  }

  return {
    type: 'l',
    name: 'alloc4',
    left: '4',
    result: id,
  }
}

function createLocalAssignement(id: string, valueId: string): Instruction {

  return {
    type: 'l',
    name: 'loadl',
    left: valueId,
    result: id,
  };
}

function writeLocal(id: string, value: string): Instruction {

  return {
    type: 'l',
    name: 'storel',
    left: value,
    right: '%' + id,
  };
}

function loadLocal(id: string): Instruction {
  const result = generateGlobalIdentifier();
  const type = 'l';

  return {
    type,
    name: 'load' + type,
    left: id,
    result,
  };
}

function createLocalVariable(
  t: Object,
  assignement: BabelASTNode,
): [?Instruction] {
  const {left, right, loc} = assignement;

  if (t.isIdentifier(right)) {

    const res = [];

    if (pointers.has(right.name)) {
      const load = loadLocal('%' + right.name);

      res.push(load);
      right.name = load.result;
    }

    pointers.delete(right.name);
    res.push(writeLocal(left.name, '%' + right.name));

    return res;
  } else if (t.isBinaryExpression(right)) {
    const {left, right, operator} = assignement.right;

    if (t.isIdentifier(left)) {
      left.value = '%' + left.name;
    }

    if (t.isIdentifier(right)) {
      right.value = '%' + right.name;
    }

    const op = createOperation(operator, left.value, right.value);
    const store = writeLocal(left.value.substr(1), '%' + op[op.length - 1].result);

    return [
      ...op,
      store,
    ];
  } else if (t.isNumericLiteral(right)) {
    const {left, right} = assignement;

    return [writeLocal(left.name, right.value)];
  } else if (t.isStringLiteral(right)) {
    return createStringData(left.name, right.value);
  } else if (t.isBooleanLiteral(right)) {
    const {left, right} = assignement;

    return [writeLocal(left.name, +right.value)];
  } else {
    return panic('Unsupported assignement (' + left.type + ' = ' + right.type + ')', loc);
  }
}

function identifier(name: string): Instruction {
  return {
    onlyIdentifier: true,
    result: name,
  };
}

module.exports = {
  createStringData,
  createLocalNumberData,
  createLocalVariable,
  writeLocal,
  createLocalAssignement,
  loadLocal,
  identifier,
  alloc4,
};
