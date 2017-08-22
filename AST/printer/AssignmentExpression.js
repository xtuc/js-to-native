const t = require('babel-types');

const IL = require('../../IL');
const {generateGlobalIdentifier} = require('../../utils');

module.exports = function(path, {code, isMain}) {
  const appendInstructions = (isMain
    ? code.appendMainInstructions
    : code.appendInstructions).bind(code);
  const append = (isMain ? code.appendMain : code.append).bind(code);

  if (process._debug === true) {
    const source = path.getSource();

    if (source) {
      appendInstructions([IL.comments.createComment(source)]);
    } else {
      appendInstructions([IL.comments.createComment('AssignmentExpression')]);
    }
  }

  if (t.isCallExpression(path.node.right)) {
    const id = t.identifier(generateGlobalIdentifier());
    const args = IL.functions.createArguments(
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

  const localVar = IL.variable.createLocalVariable(t, path.node, appendInstructions, path);

  appendInstructions(localVar);
};
