const t = require('babel-types');
const traverse = require('babel-traverse').default;

const IL = require('../../IL');
const ILConsoleLog = require('../../IL/console.log');
const {generateGlobalIdentifier, getFlowTypeAtPos, panic, getVarWithType} = require('../../utils');
const CodeBuffer = require('../../buffer');

module.exports = function(path, {code, isMain}) {
  const {callee} = path.node;
  const id = generateGlobalIdentifier();

  const append = (isMain ? code.appendMain : code.append).bind(code);
  const appendInstructions = (isMain
    ? code.appendMainInstructions
    : code.appendInstructions).bind(code);

  if (process._debug === true) {
    const source = path.getSource();

    if (source) {
      appendInstructions([IL.comments.createComment(source)]);
    } else {
      appendInstructions([IL.comments.createComment('CallExpression')]);
    }
  }

  if (
    t.isMemberExpression(callee) &&
    callee.object.name === 'console' &&
    callee.property.name === 'log'
  ) {
    ILConsoleLog(path, id, append, code, appendInstructions);

    path.skip();
  } else if (t.isFunctionExpression(callee)) {
    const {body} = callee;
    let {params} = callee;

    if (params.length > 0) {
      params = params.map(function(param) {
        const type = getFlowTypeAtPos(param.loc);

        return getVarWithType(type, param.name);
      });
    }

    const state = {isMain: false, code: new CodeBuffer()};
    const id = generateGlobalIdentifier();
    const args = IL.functions.createArguments(
      t,
      appendInstructions,
      path.node.arguments,
      path,
      code.appendGlobalInstructions.bind(code)
    );

    const {visitor} = require('./index');
    traverse(body, visitor, null, state);

    const hasReturnStatement = !!body.body.find((e) => t.isReturnStatement(e));
    if (hasReturnStatement === false) {

      state.code.appendInstructions([
          IL.functions.ret(0),
      ]);
    }

    code.append(IL.functions._function(id, state.code.get(), 'w', params));

    code.appendGlobal(state.code.getGlobals());

    append(`call $${id}(${args.join(',')})`);

    path.skip();
  } else {
    const args = IL.functions.createArguments(
      t,
      appendInstructions,
      path.node.arguments,
      path,
      code.appendGlobalInstructions.bind(code)
    );

    append(`call $${callee.name}(${args.join(',')})`);

    path.skip();
  }
};
