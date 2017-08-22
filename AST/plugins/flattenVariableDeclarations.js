/**
 *
 * Transforms:
 *
 * var a = 1, b = 0, temp = 0;
 *
 * into:
 *
 * var a = 1;
 * var b = 0;
 * var temp = 0;
 *
 */

module.exports = function(babel) {
  const {types: t} = babel;

  return {
    visitor: {
      VariableDeclaration(path) {
        if (path.node.declarations.length === 1) {
          return path.skip();
        }

        const declarations = path.node.declarations.reduce(
          function(acc, decl) {

            const newDecl = t.variableDeclaration(path.node.kind, [
              t.variableDeclarator(decl.id, decl.init),
            ]);

            acc.push(newDecl);

            return acc;
          },
          []
        );

        path.replaceWithMultiple(declarations);
      },
    },
  };
}

