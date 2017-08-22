const t = require('babel-types');
const {generateGlobalIdentifier} = require('../../utils');
const {createOperation} = require('../../IL/builtin/arithmetic');
const {createComment} = require('../../IL/comments.js');
const {writeLocal, createLocalNumberData} = require('../../IL/variable');

module.exports = function(path, {code, isMain}) {
  const appendInstructions = (isMain
    ? code.appendMainInstructions
    : code.appendInstructions).bind(code);
  const id = generateGlobalIdentifier();

  if (process._debug === true) {
    const source = path.getSource();

    if (source) {
      appendInstructions([createComment(source)]);
    } else {
      appendInstructions([createComment('BinaryExpression')]);
    }
  }

  const {left, right, operator} = path.node;

  if (t.isIdentifier(left)) {
    left.value = '%' + left.name;
  }

  if (t.isIdentifier(right)) {
    right.value = '%' + right.name;
  }

  const op = createOperation(operator, left.value, right.value);
  const store = writeLocal(id, '%' + op[op.length - 1].result);

  appendInstructions([...createLocalNumberData(id, '0'), ...op, store]);
};
