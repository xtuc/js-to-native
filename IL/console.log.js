const t = require('babel-types');
const runtime = require('./runtime');
const {pointers} = require('./cache');
const assert = require('assert');
const {logNumber, logIdentifierString, logIdentifierNumber} = require('./stdlib/console');
const {panic, getFlowTypeAtPos} = require('../utils');
const {createOperation} = require('./builtin/arithmetic');
const {createStringData} = require('./variable');

module.exports = function(path, id, append, code, appendInstructions) {
  let firstArg = path.node.arguments[0];
  let globalIdentifier = true;

  if (t.isBinaryExpression(firstArg)) {
    const {left, right, operator, loc} = firstArg;

    const operation = createOperation(
      operator,
      left.value || '%' + left.name,
      right.value || '%' + right.name
    );

    if (typeof operation === 'undefined') {
      return panic('Unsupported arithmetic operation', loc);
    }

    appendInstructions(operation);

    firstArg = t.identifier(operation[operation.length - 1].result.substr(1));
    globalIdentifier = false;

    firstArg._ignore = true;

    // Virtually declare a new variable in scope
    path.scope.push({id: firstArg});
  }

  if (t.isMemberExpression(firstArg)) {
    const id = t.identifier(firstArg.object.name + '_' + firstArg.property.name);
    id.loc = firstArg.property.loc;

    id._ignore = true;

    firstArg = id;

    // Virtually declare a new variable in scope
    path.scope.push({id: firstArg});
  }

  const firstArgType = getFlowTypeAtPos(firstArg.loc);

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

      const needLoad = pointers.has(firstArg.name);

      appendInstructions(
        logIdentifierNumber(firstArg.name, globalIdentifier ? '$' : '%', needLoad)
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
