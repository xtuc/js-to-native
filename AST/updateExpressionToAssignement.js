/**
 *
 * Transforms:
 *
 * num--
 * num++
 *
 * into:
 *
 * const _num = num - 1;
 * const _num2 = num + 1;
 *
 */

module.exports = function(babel) {
  const { types: t } = babel;

  return {
    visitor: {
      UpdateExpression(path) {
        const { operator, argument } = path.node;
        const newId = path.scope.generateUidIdentifierBasedOnNode(argument);
        const one = t.numericLiteral(1);

        let init;

        if (operator === "--") {
          init = t.binaryExpression("-", argument, one);
        } else if (operator === "++") {
          init = t.binaryExpression("+", argument, one);
        }

        const decl = t.variableDeclaration("const", [
          t.variableDeclarator(newId, init)
        ]);

        path.replaceWithMultiple(decl);
      }
    }
  };
};

