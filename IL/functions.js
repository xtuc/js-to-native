const dedent = require('dedent');
const {panic, getFlowTypeAtPos, generateGlobalIdentifier} = require('../utils');
const {createLocalNumberData} = require('./variable');

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

function createArguments(appendInstructions: any, args: [Object]): [string] {

  return args.map(id => {
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
