const t = require('babel-types');
const {generateGlobalIdentifier} = require('../../utils');
const IL = require('../../IL');

module.exports = function(path, {code, isMain}) {
  const appendInstructions = (isMain
    ? code.appendMainInstructions
    : code.appendInstructions).bind(code);
  const id = generateGlobalIdentifier();

  if (process._debug === true) {
    const source = path.getSource();

    if (source) {
      appendInstructions([IL.comments.createComment(source)]);
    } else {
      appendInstructions([IL.comments.createComment('BinaryExpression')]);
    }
  }

  const {left, right, operator} = path.node;

  if (t.isIdentifier(left)) {
    left.value = '%' + left.name;
  }

  if (t.isIdentifier(right)) {
    right.value = '%' + right.name;
  }

  const op = IL.builtin.arithmetic.createOperation(operator, left.value, right.value);
  const store = IL.variable.writeLocal(id, '%' + op[op.length - 1].result);

  appendInstructions([...IL.variable.createLocalNumberData(id, '0'), ...op, store]);
};
