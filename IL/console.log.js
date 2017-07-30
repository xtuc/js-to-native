const t = require('babel-types');
const runtime = require('./runtime');
const assert = require('assert');
const {panic, getFlowTypeAtPos} = require('../utils');
const {logNumber, logIdentifierString, logIdentifierNumber} = require('./stdlib/console');
const {createOperation} = require('./builtin/arithmetic');
const {createStringData} = require('./variable');

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

      // Variable passed here is an argument of the function
      if (firstArg.name === binding.path.node.name) {
        globalIdentifier = false;
      }

      if (path.scope.hasBinding(firstArg.name)) {
        globalIdentifier = false;
      }

      appendInstructions(
        logIdentifierNumber(firstArg.name, globalIdentifier ? '$' : '%')
      );

    } else {
      const value = firstArg.value;

      appendInstructions(logNumber(value));
    }

  } else if (firstArgType === 'string') {
    code.appendGlobal(runtime.getStringFormat());

    if (t.isIdentifier(firstArg)) {
      const binding = path.scope.getBinding(firstArg.name);
      assert.ok(binding);

      appendInstructions(logIdentifierString('$' + firstArg.name));

    } else {
      const value = firstArg.value;
      const stringData = createStringData(id, value);

      code.appendGlobalInstructions([stringData]);

      appendInstructions(logIdentifierString('$' + id));
    }
  } else {
    return panic(`Unexpected type: ${firstArgType}`, firstArg.loc);
  }
};
