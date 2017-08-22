const traverse = require('babel-traverse').default;
const t = require('babel-types');

const IL = require('../../IL');
const {generateGlobalIdentifier} = require('../../utils');
const CodeBuffer = require('../../buffer');

module.exports = function(path, {code, isMain}) {
  const {body, test} = path.node;
  const append = (isMain ? code.appendMain : code.append).bind(code);
  const appendInstructions = (isMain
    ? code.appendMainInstructions
    : code.appendInstructions).bind(code);

  if (process._debug === true) {
    const source = path.getSource();

    if (source) {
      appendInstructions([IL.comments.createComment(source)]);
    } else {
      appendInstructions([IL.comments.createComment('WhileStatement')]);
    }
  }

  const continueId = 'continue' + generateGlobalIdentifier();
  const loopId = 'loop' + generateGlobalIdentifier();
  const conditionId = 'condition' + generateGlobalIdentifier();

  const state = {isMain: false, code: new CodeBuffer()};

  append(IL.blocks.empty(conditionId));

  const eq = IL.conditions.createCondition(t, test, code.appendGlobalInstructions.bind(code));
  appendInstructions(eq);

  // Loop or continue
  append(`jnz ${eq[eq.length - 1].result}, @${loopId}, @${continueId}`);

  // Loop body
  const {visitor} = require('./index');
  traverse(body, visitor, null, state);

  append(IL.blocks.block(loopId, state.code.get()));
  code.appendGlobal(state.code.getGlobals());

  append('jmp @' + conditionId);

  append(IL.blocks.empty(continueId));
  path.skip();
};
