const t = require('babel-types');
const traverse = require('babel-traverse').default;

const genBlock = require('../../IL/blocks');
const {createComment} = require('../../IL/comments.js');
const {createCondition} = require('../../IL/conditions');
const {generateGlobalIdentifier} = require('../../utils');
const CodeBuffer = require('../../buffer');

module.exports = function(path, {code, isMain}) {
  const {visitor} = require('./index');
  const {test, alternate, consequent} = path.node;

  const append = (isMain ? code.appendMain : code.append).bind(code);
  const appendInstructions = (isMain
    ? code.appendMainInstructions
    : code.appendInstructions).bind(code);

  if (process._debug === true) {
    const source = path.getSource();

    if (source) {
      appendInstructions([createComment(source)]);
    } else {
      appendInstructions([createComment('IfStatement')]);
    }
  }

  const eq = createCondition(t, test, code.appendGlobalInstructions.bind(code));
  const conditionId = '%' + eq[eq.length - 1].result;

  appendInstructions(eq);

  // conditional jump
  const consequentBlockid = generateGlobalIdentifier();
  const alternateBlockid = generateGlobalIdentifier();

  append(`jnz ${conditionId}, @${consequentBlockid}, @${alternateBlockid}`);

  // consequent block
  const consequentState = {isMain: false, code: new CodeBuffer()};

  traverse(consequent, visitor, null, consequentState);

  append(genBlock.block(consequentBlockid, consequentState.code.get()));
  append('jmp @continue');

  code.appendGlobal(consequentState.code.getGlobals());

  // alternate block
  if (alternate !== null) {
    const alternateState = {isMain: false, code: new CodeBuffer()};

    traverse(alternate, visitor, null, alternateState);

    append(genBlock.block(alternateBlockid, alternateState.code.get()));
    append('jmp @continue');

    code.appendGlobal(alternateState.code.getGlobals());
  } else {
    append(genBlock.empty(alternateBlockid));
  }

  append(genBlock.empty('continue'));

  path.skip();
};
