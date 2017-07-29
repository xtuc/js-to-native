/**
 *
 * Transforms:
 *
 * t("t", 1, a)
 *
 * into:
 *
 * const _temp = "t";
 * const _temp2 = 1;
 * t(_temp, _temp2, a);
 *
 */

module.exports = function(babel) {
  const {types: t} = babel;

  return {
    visitor: {
      CallExpression(path) {
        if (path.node.arguments.length === 0 || path.node._transformed) {
          return path.skip();
        }

        const declarations = path.node.arguments.reduce(function(
          acc,
          arg,
          index
        ) {
          if (!t.isStringLiteral(arg) && !t.isNumericLiteral(arg)) {
            return acc;
          }

          const id = path.scope.generateUidIdentifier();
          const decl = t.variableDeclaration('const', [
            t.variableDeclarator(id, arg)
          ]);

          acc.push(decl);

          path.node.arguments[index] = id;

          return acc;
        }, []);

        path.node._transformed = true;
        declarations.push(t.expressionStatement(path.node));

        path.replaceWithMultiple(declarations);
      }
    }
  };
};

