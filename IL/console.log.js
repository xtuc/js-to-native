const t = require('babel-types');
const runtime = require('./runtime');
const assert = require('assert');
const {panic, getFlowTypeAtPos} = require('../utils');
const {logNumber, logGlobalIdentifierString, logGlobalIdentifierNumber} = require('./stdlib/console');

module.exports = function(path, id, append, code, appendInstructions) {
  const firstArg = path.node.arguments[0];
  const firstArgType = getFlowTypeAtPos(firstArg.loc);

  if (firstArgType === 'number') {
    code.appendGlobal(runtime.getIntegerFormat());

    if (t.isIdentifier(firstArg)) {
      const binding = path.scope.getBinding(firstArg.name);
      assert.ok(binding);

      appendInstructions(logGlobalIdentifierNumber(firstArg.name));

    } else {
      const value = firstArg.value;

      appendInstructions(logNumber(value));
    }

  } else if (firstArgType === 'string') {
    code.appendGlobal(runtime.getStringFormat());

    if (t.isIdentifier(firstArg)) {
      const binding = path.scope.getBinding(firstArg.name);
      assert.ok(binding);

      appendInstructions(logGlobalIdentifierString(firstArg.name));

    } else {
      const value = firstArg.value;

      code.appendGlobal(`data $${id} = { b "${value}" }`);

      appendInstructions(logGlobalIdentifierString(id));
    }
  } else {
    return panic(`Unexpected type: ${firstArgType}`, firstArg.loc);
  }

  // if (t.isIdentifier(firstArg)) {
  //   const value = '$' + firstArg.name;

  //   const binding = path.scope.getBinding(firstArg.name);
  //   assert.ok(binding);

  //   let formater;

  //   switch (getFlowTypeAtPos(binding.path.node.loc)) {
  //   case 'string':
  //     code.appendGlobal(runtime.getStringFormat());
  //     formater = 'stringFmt';
  //     break;
  //   case 'number':
  //     code.appendGlobal(runtime.getIntegerFormat());
  //     formater = 'integerFmt';
  //     break;
  //   default:
  //     throw new Error('unsupported type: ' + getFlowTypeAtPos(binding.path.node.loc));
  //   }

  //   append(`call $printf(l $${formater}, w ${value})`);
  // } else if (t.isBinaryExpression(firstArg)) {
  //   const {left, right} = firstArg;

  //   code.appendGlobal(runtime.getIntegerFormat());

  //   let operation;

  //   switch (firstArg.operator) {
  //   case '+':
  //     operation = 'add';
  //     break;
  //   case '-':
  //     operation = 'sub';
  //     break;
  //   case '/':
  //     operation = 'div';
  //     break;
  //   case '*':
  //     operation = 'mul';
  //     break;
  //   }

  //   append(
  //     `%${id} =w ${operation} ${left.value}, ${right.value}\n` +
  //       `call $printf(l $integerFmt, w %${id})`
  //   );
  // } else {
  //   throw new Error(`Unexpected node type: ${path.type}`);
  // }
};
