const traverse = require('babel-traverse').default;
const t = require('babel-types');

const {createComment} = require('../../IL/comments.js');
const {createCondition} = require('../../IL/conditions');
const genBlock = require('../../IL/blocks');
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
      appendInstructions([createComment(source)]);
    } else {
      appendInstructions([createComment('WhileStatement')]);
    }
  }

  const continueId = 'continue' + generateGlobalIdentifier();
  const loopId = 'loop' + generateGlobalIdentifier();
  const conditionId = 'condition' + generateGlobalIdentifier();

  const state = {isMain: false, code: new CodeBuffer()};

  append(genBlock.empty(conditionId));

  const eq = createCondition(t, test, code.appendGlobalInstructions.bind(code));
  appendInstructions(eq);

  // Loop or continue
  append(`jnz ${eq[eq.length - 1].result}, @${loopId}, @${continueId}`);

  // Loop body
  const {visitor} = require('./index');
  traverse(body, visitor, null, state);

  append(genBlock.block(loopId, state.code.get()));
  code.appendGlobal(state.code.getGlobals());

  append('jmp @' + conditionId);

  append(genBlock.empty(continueId));
  path.skip();
};
