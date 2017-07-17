const t = require('babel-types');
const runtime = require('./runtime');
const assert = require('assert');
const {panic, getFlowTypeAtPos} = require('../utils');
const {logNumber, logGlobalIdentifierString, logIdentifierNumber} = require('./stdlib/console');
const {createOperation} = require('./builtin/arithmetic');

module.exports = function(path, id, append, code, appendInstructions) {
  let firstArg = path.node.arguments[0];
  let globalIdentifier = true;
  const firstArgType = getFlowTypeAtPos(firstArg.loc);

  if (t.isBinaryExpression(firstArg)) {
    const {left, right, operator, loc} = firstArg;

    const operation = createOperation(operator, left.value, right.value);

    if (typeof operation === 'undefined') {
      return panic('Unsupported arithmetic operation', loc);
    }

    appendInstructions([operation]);

    firstArg = t.identifier(operation.result);
    globalIdentifier = false;

    // Virtually declare a new variable in scope
    path.scope.push({id: firstArg});
  }

  if (firstArgType === 'number') {
    code.appendGlobal(runtime.getIntegerFormat());

    if (t.isIdentifier(firstArg)) {
      const binding = path.scope.getBinding(firstArg.name);
      assert.ok(binding);

      appendInstructions(logIdentifierNumber(firstArg.name, (globalIdentifier ? '$' : '%')));

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
};
