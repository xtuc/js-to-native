const dedent = require('dedent');
const assert = require('assert');
const {panic, getFlowTypeAtPos, generateGlobalIdentifier} = require('../utils');
const {createLocalNumberData, loadLocal} = require('./variable');
const {createOperation} = require('./builtin/arithmetic');
const {pointers} = require('./cache');

function _function(name, body, returnType = 'w', args = []) {

  return dedent`
    function ${returnType} $${name}(${args.join(',')}) {
      @start
        ${body}
        ret 0
    }
  `;
}

function main(body) {
  return 'export ' +  _function('main', body);
}

function createArguments(t: Object, appendInstructions: any, args: [Object], path): [string] {

  return args.map((id) => {
    let globalIdentifier = true;
    const argType = getFlowTypeAtPos(id.loc);

    if (t.isBinaryExpression(id)) {
      const {left, right, operator, loc} = id;

      const operation = createOperation(
        operator,
        left.value || '%' + left.name,
        right.value || '%' + right.name
      );

      if (typeof operation === 'undefined') {
        return panic('Unsupported arithmetic operation', loc);
      }

      appendInstructions(operation);

      const idOldLoc = id.loc;

      id = t.identifier(operation[operation.length - 1].result.substr(1));
      id.loc = idOldLoc;
      id._ignore = true;

      globalIdentifier = false;

      // Virtually declare a new variable in scope
      path.scope.push({id: id});
    }

    if (argType === 'number') {

      if (t.isIdentifier(id)) {
        const binding = path.scope.getBinding(id.name);
        assert.ok(binding);

        // Variable passed here is an argument of the function
        if (id.name === binding.path.node.name) {
          globalIdentifier = false;
        }

        if (path.scope.hasBinding(id.name)) {
          globalIdentifier = false;
        }

        // Load it if it's a pointer
        if (pointers.has(id.name)) {
          const local = loadLocal(globalIdentifier ? '$' : '%' + id.name);
          id.name = local.result;

          appendInstructions([
            local,
          ]);

          pointers.delete(id.name);
        }

        // appendInstructions(
        //   logIdentifierNumber(id.name, globalIdentifier ? '$' : '%')
        // );

      } else {
        // const value = id.value;

        // appendInstructions(logNumber(value));
      }

    } else if (argType === 'string') {

      if (t.isIdentifier(id)) {
        const binding = path.scope.getBinding(id.name);
        assert.ok(binding);

        // appendInstructions(logIdentifierString('$' + id.name));

      } else {
        const value = id.value;
        const stringData = createStringData(id, value);

        // code.appendGlobalInstructions([stringData]);

        // appendInstructions(logIdentifierString('$' + id));
      }
    } else {
      return panic(`Unexpected type: ${argType}`, argType.loc);
    }

    const type = getFlowTypeAtPos(id.loc);

    // Has a value, create a binding
    if (typeof id.value !== 'undefined') {
      id.name = generateGlobalIdentifier();

      appendInstructions(createLocalNumberData(id.name, '' + id.value));
    }

    if (type === 'number') {
      return 'w %' + id.name;
    } else {
      return panic('Unsupported type', id.loc);
    }
  });
}

module.exports = {_function, main, createArguments};
