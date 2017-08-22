const t = require('babel-types');

const {createArguments} = require('../../IL/functions');
const {createComment} = require('../../IL/comments.js');
const {generateGlobalIdentifier} = require('../../utils');
const {createLocalVariable} = require('../../IL/variable');

module.exports = function(path, {code, isMain}) {
  const appendInstructions = (isMain
    ? code.appendMainInstructions
    : code.appendInstructions).bind(code);
  const append = (isMain ? code.appendMain : code.append).bind(code);

  if (process._debug === true) {
    const source = path.getSource();

    if (source) {
      appendInstructions([createComment(source)]);
    } else {
      appendInstructions([createComment('AssignmentExpression')]);
    }
  }

  if (t.isCallExpression(path.node.right)) {
    const id = t.identifier(generateGlobalIdentifier());
    const args = createArguments(
      t,
      appendInstructions,
      path.node.right.arguments,
      path
    );

    append(
      `%${id.name} =l call $${path.node.right.callee.name}(${args.join(',')})`
    );

    path.node.right = id;
    path.scope.push({id});
  }

  const localVar = createLocalVariable(t, path.node, appendInstructions, path);

  appendInstructions(localVar);
};
