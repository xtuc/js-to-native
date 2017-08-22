const traverse = require('babel-traverse').default;

const {getFlowTypeAtPos, panic} = require('../../utils');
const IL = require('../../IL');
const CodeBuffer = require('../../buffer');

module.exports = function(path, {code}) {
  const {id, body} = path.node;
  let {params} = path.node;

  const state = {isMain: false, code: new CodeBuffer()};

  const {visitor} = require('./index');
  traverse(body, visitor, null, state);

  if (params.length > 0) {
    params = params.map(function(param) {
      const type = getFlowTypeAtPos(param.loc);

      if (type === 'number') {
        return 'w %' + param.name;
      } else {
        return panic('Unsupported type', param.loc);
      }
    });
  }

  code.append(IL.functions._function(id.name, state.code.get(), 'w', params));

  code.appendGlobal(state.code.getGlobals());

  path.skip();
};
