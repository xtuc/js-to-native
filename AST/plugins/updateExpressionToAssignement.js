/**
 *
 * Transforms:
 *
 * num--
 * num++
 *
 * into:
 *
 * num = num - 1;
 * num = num + 1;
 *
 */
module.exports = function(babel) {
  const {types: t} = babel;

  return {
    visitor: {
      UpdateExpression(path) {
        const {operator, argument} = path.node;
        const one = t.numericLiteral(1);

        let init;

        if (operator === '--') {
          init = t.binaryExpression('-', argument, one);
        } else if (operator === '++') {
          init = t.binaryExpression('+', argument, one);
        }

        const decl = t.assignmentExpression('=', argument, init);

        path.replaceWith(decl);
      },
    },
  };
};

