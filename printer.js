const traverse = require('babel-traverse').default;
const t = require('babel-types');
const dedent = require('dedent');
const runtime = require('./runtime');
const gen = require('./generator');
const assert = require('assert');

let i = 0;
function generateGlobalIdentifier() {
  i++;
  return 'i' + i;
}

function getIdentifierType(id) {
  const annotation = id.typeAnnotation.typeAnnotation;

  if (t.isStringTypeAnnotation(annotation)) {
    return 'string';
  } else if (t.isNumberTypeAnnotation(annotation)) {
    return 'integer';
  } else {
    throw new Error(`Unexpected type annotation: ${annotation.type}`);
  }
}

class Buffer {

  constructor() {
    this._buf = [];
    this._bufMain = [];
  }

  get() {

    const main = gen.main(
      this._bufMain.join('\n')
    );

    return this._buf.join('\n') + '\n' + main;
  }

  append(str) {
    this._buf.push(str);
  }

  prepend(str) {
    this._buf.unshift(str);
  }

  appendMain(str) {
    this._bufMain.push(str);
  }
}

const visitor = {

  Program: {

    exit(_, {code}) {
      code.append('');
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
    const name = callee.object.name + callee.property.name + id;

    if (
      t.isMemberExpression(callee) &&
      callee.object.name === 'console' &&
      callee.property.name === 'log'
    ) {
      const firstArg = path.node.arguments[0];

      if (t.isNumericLiteral(firstArg)) {
        const value = firstArg.value;

        code.prepend(runtime.getIntegerFormat());

        code.appendMain(dedent`
            %${id} =w copy ${value}
            call $printf(l $integerFmt, w %${id})
        `);

      } else if (t.isIdentifier(firstArg)) {
        const value = '$' + firstArg.name;

        const binding = path.scope.getBinding(firstArg.name);
        assert.ok(binding);

        let formater;

        switch (getIdentifierType(binding.path.node.id)) {
        case 'string':
          code.prepend(runtime.getStringFormat());
          formater = 'stringFmt';
          break;
        case 'integer':
          code.prepend(runtime.getIntegerFormat());
          formater = 'integerFmt';
          break;
        }

        code.appendMain(dedent`
            call $printf(l $${formater}, w ${value})
        `);

      } else if (t.isStringLiteral(firstArg)) {
        const value = firstArg.value;

        code.prepend(runtime.getStringFormat());

        code.append(dedent`
          data $${id} = { b "${value}" }
       `);

        code.appendMain(dedent`
            call $printf(l $stringFmt, w $${id})
        `);

      } else if (t.isBinaryExpression(firstArg)) {
        const {left, right} = firstArg;

        code.prepend(runtime.getIntegerFormat());

        let operation;

        switch (firstArg.operator) {
        case '+':
          operation = 'add';
          break;
        case '-':
          operation = 'sub';
          break;
        case '/':
          operation = 'div';
          break;
        case '*':
          operation = 'mul';
          break;
        }

        code.appendMain(dedent`
            %${id} =w ${operation} ${left.value}, ${right.value}
            call $printf(l $integerFmt, w %${id})
        `);

      } else {
        throw new Error(`Unexpected node type: ${path.type}`);
      }

    }
  },

  FunctionDeclaration(path, {code}) {
    const {id} = path.node;

    code.append(gen._function(id.name, dedent`
    `));
  },

};

module.exports = function Printer(ast) {
  const scope = null;
  const state = {code: new Buffer};

  traverse(ast, visitor, scope, state);

  return {code: state.code.get()};
};
