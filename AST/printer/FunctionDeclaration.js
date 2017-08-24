const traverse = require('babel-traverse').default;
const t = require('babel-types');

const {getFlowTypeAtPos, getVarWithType} = require('../../utils');
const IL = require('../../IL');
const CodeBuffer = require('../../buffer');

module.exports = function(path, {code}) {
  const {id, body} = path.node;
  let {params} = path.node;

  const state = {isMain: false, code: new CodeBuffer()};

  const {visitor} = require('./index');
  traverse(body, visitor, null, state);

  const hasReturnStatement = !!body.body.find((e) => t.isReturnStatement(e));

  if (hasReturnStatement === false) {

    state.code.appendInstructions([
      IL.functions.ret(0),
    ]);
  }

  if (params.length > 0) {
    params = params.map(function(param) {
      const type = getFlowTypeAtPos(param.loc);

      return getVarWithType(type, param.name);
    });
  }

  code.append(IL.functions._function(id.name, state.code.get(), 'w', params));
  code.appendGlobal(state.code.getGlobals());

  path.skip();
};
