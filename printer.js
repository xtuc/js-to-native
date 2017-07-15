const indentString = require('indent-string');
const traverse = require('babel-traverse').default;
const t = require('babel-types');
// const dedent = require('dedent');
// const runtime = require('./runtime');
const gen = require('./generator');
const ILConsoleLog = require('./IL/console.log');

let i = 0;
function generateGlobalIdentifier() {
  i++;
  return 'i' + i;
}

class Buffer {

  constructor() {
    this._buf = [];
    this._bufMain = [];
    this._bufGlobal = [];
  }

  getWithMain() {

    const main = gen.main(
      this._bufMain.join('\n')
    );

    return this._bufGlobal.join('\n') + '\n' + this._buf.join('\n') + '\n' + main;
  }

  get() {
    return this._buf.join('\n');
  }

  getMain() {
    return this._bufMain.join('\n');
  }

  getGlobals() {
    return this._bufGlobal.join('\n');
  }

  append(str) {
    this._buf.push(str);
  }

  appendGlobal(str) {
    this._bufGlobal.push(str);
  }

  appendMain(str) {
    this._bufMain.push(str);
  }

}

const visitor = {

  VariableDeclaration(path, {code}) {
    const [declaration] = path.node.declarations;

    if (t.isNumericLiteral(declaration.init)) {

      code.append(`data $${declaration.id.name} = { w ${declaration.init.value} }`);
    } else if (t.isStringLiteral(declaration.init)) {

      code.append(`data $${declaration.id.name} = { b "${declaration.init.value}" }`);
    }
  },

  CallExpression(path, {code, isMain}) {
    const {callee} = path.node;
    const id = generateGlobalIdentifier();

    const append = (isMain ? code.appendMain : code.append).bind(code);

    if (
      t.isMemberExpression(callee) &&
      callee.object.name === 'console' &&
      callee.property.name === 'log'
    ) {
      ILConsoleLog(path, id, append, code);
    }
  },

  FunctionDeclaration(path, {code}) {
    const {id} = path.node;
    const state = {isMain: false, code: new Buffer};

    path.traverse(visitor, state);

    code.append(gen._function(id.name,
      indentString(state.code.get(), 8)
    ));

    code.appendGlobal(state.code.getGlobals());

    path.stop();
  },

};

module.exports = function Printer(ast) {
  const scope = null;
  const state = {code: new Buffer, isMain: true};

  traverse(ast, visitor, scope, state);

  return {code: state.code.getWithMain()};
};
