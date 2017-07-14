const traverse = require('babel-traverse').default;
const t = require('babel-types');
const dedent = require('dedent');
const runtime = require('./runtime');
const gen = require('./generator');

let i = 0;
function generateGlobalIdentifier() {
  i++;
  return 'i' + i;
}

class Buffer {

  constructor() {
    this._buf = [];
  }

  get() {
    return this._buf.join('\n');
  }

  append(str) {
    this._buf.push(str);
  }
}

const visitor = {

  Program: {

    exit(_, {code}) {
      // code.append('data $fmt = { b "%d\\n" }');
      code.append('data $fmt = { b "%s\\n" }');

      code.append(gen.main(dedent`
        call $consolelog()
      `));
    }
  },

  VariableDeclaration(path, {code}) {
    const [declaration] = path.node.declarations;

    if (t.isNumericLiteral(declaration.init)) {

      code.append(dedent`
        data $${declaration.id.name} = { w ${declaration.init.value} }
     `);
    } else if (t.isStringLiteral(declaration.init)) {

      code.append(dedent`
        data $${declaration.id.name} = { b "${declaration.init.value}" }
     `);
    }
  },

  CallExpression(path, {code}) {
    const {callee} = path.node;
    const id = generateGlobalIdentifier();
    const name = callee.object.name + callee.property.name;

    if (
      t.isMemberExpression(callee) &&
      callee.object.name === 'console' &&
      callee.property.name === 'log'
    ) {
      const firstArg = path.node.arguments[0];

      if (t.isNumericLiteral(firstArg)) {
        const value = firstArg.value;

        code.append(gen._function(name, dedent`
            %${id} =w copy ${value}
            call $printf(l $fmt, w %${id})
        `));

      } else if (t.isIdentifier(firstArg)) {
        const value = '$' + firstArg.name;

        code.append(gen._function(name, dedent`
            call $printf(l $fmt, w ${value})
        `));

      } else if (t.isStringLiteral(firstArg)) {
        const value = firstArg.value;

        code.append(gen._function(name, dedent`
            %${id} =b "${value}"
            call $printf(l $fmt, w %${id})
        `));

      } else if (t.isBinaryExpression(firstArg)) {
        const {left, right} = firstArg;

        code.append(gen._function(name, dedent`
            %${id} =w add ${left.value}, ${right.value}
            call $printf(l $fmt, w %${id})
        `));
      }
    }
  },

};

module.exports = function Printer(ast) {
  const scope = null;
  const state = {code: new Buffer};

  traverse(ast, visitor, scope, state);

  return {code: state.code.get()};
};
