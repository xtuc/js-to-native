const t = require('babel-types');

const IL = require('../../IL');
const {generateGlobalIdentifier, panic} = require('../../utils');

module.exports = function(path, {code, isMain}) {
  const [declaration] = path.node.declarations;
  const append = (isMain ? code.appendMain : code.append).bind(code);
  const appendInstructions = (isMain
    ? code.appendMainInstructions
    : code.appendInstructions).bind(code);

  if (process._debug === true) {
    const source = path.getSource();

    if (source) {
      appendInstructions([IL.comments.createComment(source)]);
    } else {
      appendInstructions([IL.comments.createComment('VariableDeclaration')]);
    }
  }

  // Generated during AST traversal
  if (declaration.id._ignore === true) {
    return path.skip();
  }

  IL.cache.pointers.add(declaration.id.name);

  if (t.isNumericLiteral(declaration.init)) {
    appendInstructions(
      IL.variable.createLocalNumberData(declaration.id.name, declaration.init.value)
    );
  } else if (t.isStringLiteral(declaration.init)) {
    appendInstructions([
      IL.variable.createStringData(declaration.id.name, declaration.init.value),
    ]);
  } else if (t.isUnaryExpression(declaration.init, {operator: '-'})) {
    const {argument} = declaration.init;

    const negativeValue = IL.stdlib.number.negateNumber(argument.value);
    const localVar = IL.variable.createLocalNumberData(
      declaration.id.name,
      '%' + negativeValue.result
    );

    appendInstructions([negativeValue, ...localVar]);
  } else if (t.isBinaryExpression(declaration.init)) {
    const {left, right, operator} = declaration.init;

    if (t.isIdentifier(left)) {
      left.value = '%' + left.name;
    }

    if (t.isIdentifier(right)) {
      right.value = '%' + right.name;
    }

    // It's a comparaison
    if (operator === '===') {
      appendInstructions([
        IL.comparisons.createStrictComparaison(declaration.id.name, left.value, right.value),
      ]);
    } else {
      // It's arithmetic

      const op = IL.buitin.arithemtic.createOperation(operator, left.value, right.value);
      const store = IL.variable.writeLocal(
        declaration.id.name,
        '%' + op[op.length - 1].result
      );

      appendInstructions([
        ...IL.variable.createLocalNumberData(declaration.id.name, '0'),
        ...op,
        store,
      ]);
    }

    path.skip();
  } else if (t.isCallExpression(declaration.init)) {
    const {callee} = declaration.init;
    const id = '%' + generateGlobalIdentifier();
    const args = IL.functions.createArguments(
      t,
      appendInstructions,
      declaration.init.arguments,
      path
    );

    append(
      `${id} =l call $${callee.name}(${args.join(', ')})`
    ), appendInstructions(IL.variable.createLocalNumberData(declaration.id.name, id));
    path.skip();
  } else {
    return panic(
      `Unsupported type (${declaration.id.type} = ${declaration.init.type})`,
      declaration.id.loc
    );
  }
};
