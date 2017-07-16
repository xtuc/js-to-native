const t = require('babel-types');
const runtime = require('../runtime');
const assert = require('assert');
const {getIdentifierType} = require('../utils');

module.exports = function(path, id, append, code) {
  const firstArg = path.node.arguments[0];

  if (t.isNumericLiteral(firstArg)) {
    const value = firstArg.value;

    code.appendGlobal(runtime.getIntegerFormat());

    append(
      `%${id} =w copy ${value}\n` + `call $printf(l $integerFmt, w %${id})`
    );
  } else if (t.isIdentifier(firstArg)) {
    const value = '$' + firstArg.name;

    const binding = path.scope.getBinding(firstArg.name);
    assert.ok(binding);

    let formater;

    switch (getIdentifierType(binding.path.node.id, binding.path.node.loc)) {
    case 'string':
      code.appendGlobal(runtime.getStringFormat());
      formater = 'stringFmt';
      break;
    case 'integer':
      code.appendGlobal(runtime.getIntegerFormat());
      formater = 'integerFmt';
      break;
    }

    append(`call $printf(l $${formater}, w ${value})`);
  } else if (t.isStringLiteral(firstArg)) {
    const value = firstArg.value;

    code.appendGlobal(runtime.getStringFormat());
    code.appendGlobal(`data $${id} = { b "${value}" }`);

    append(`call $printf(l $stringFmt, w $${id})`);
  } else if (t.isBinaryExpression(firstArg)) {
    const {left, right} = firstArg;

    code.appendGlobal(runtime.getIntegerFormat());

    let operation;

    switch (firstArg.operator) {
    case '+':
      operation = 'add';
      break;
    case '-':
      operation = 'sub';
      break;
    case '/':
      operation = 'div';
      break;
    case '*':
      operation = 'mul';
      break;
    }

    append(
      `%${id} =w ${operation} ${left.value}, ${right.value}\n` +
        `call $printf(l $integerFmt, w %${id})`
    );
  } else {
    throw new Error(`Unexpected node type: ${path.type}`);
  }
};
