const traverse = require('babel-traverse').default;
const t = require('babel-types');
// const dedent = require('dedent');
// const runtime = require('./runtime');
const genFunction = require('./IL/functions');
const genBlock = require('./IL/blocks');
const ILConsoleLog = require('./IL/console.log');
const {integerEqInteger} = require('./IL/comparisons');
const {panic, getIdentifierType} = require('./utils');

let i = 0;
function generateGlobalIdentifier() {
  i++;
  return 'i' + i;
}

function debug(...msg) {
  return '# <------------ ' + msg.join(',');
}

class Buffer {

  constructor() {
    this._buf = [];
    this._bufMain = [];
    this._bufGlobal = [];
  }

  getWithMain() {

    const main = genFunction.main(
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
  noScope: true,

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
    } else {
      append(`call $${callee.name}()`);
    }
  },

  FunctionDeclaration(path, {code}) {
    const {id, body} = path.node;
    const state = {isMain: false, code: new Buffer};

    traverse(body, visitor, null, state);

    code.append(genFunction._function(id.name,
      state.code.get()
    ));

    code.appendGlobal(state.code.getGlobals());

    path.skip();
  },

  IfStatement(path, {code, isMain}) {
    const {test, alternate, consequent} = path.node;

    const append = (isMain ? code.appendMain : code.append).bind(code);
    const conditionId = generateGlobalIdentifier();

    // test
    if (
      t.isBinaryExpression(test, {operator: '==='}) &&
      t.isNumericLiteral(test.left) &&
      t.isNumericLiteral(test.right)
    ) {
      append(`%${conditionId} =w ${integerEqInteger(test.left, test.right)}`);
    } else if (t.isBinaryExpression(test, {operator: '==='})) {
      const identifier = path.scope.getBinding(test.left.name).path.node.id;

      if (getIdentifierType(identifier, identifier.loc) === 'integer') {
        append(`%${identifier.name} =w copy $${identifier.name}`);
        append(`%${conditionId} =w ${integerEqInteger({value: '%' + identifier.name}, test.right)}`);
      }

    } else {
      panic(
        `Unsupported test condition: ${test.type} (${test.left.type} ${test.operator} ${test.right.type})`,
        test.loc
      );
    }

    // conditional jump
    const consequentBlockid = generateGlobalIdentifier();
    const alternateBlockid = generateGlobalIdentifier();

    append(`jnz %${conditionId}, @${consequentBlockid}, @${alternateBlockid}`);

    // consequent block
    const consequentState = {isMain: false, code: new Buffer};

    traverse(consequent, visitor, null, consequentState);

    append(genBlock.block(consequentBlockid, consequentState.code.get()));
    append('jmp @continue');

    code.appendGlobal(consequentState.code.getGlobals());

    // alternate block
    if (alternate !== null) {
      const alternateState = {isMain: false, code: new Buffer};

      traverse(alternate, visitor, null, alternateState);

      append(genBlock.block(alternateBlockid, alternateState.code.get()));
      append('jmp @continue');

      code.appendGlobal(alternateState.code.getGlobals());
    } else {
      append(genBlock.empty(alternateBlockid));
    }

    append(genBlock.empty('continue'));

    path.skip();
  },

};

module.exports = function Printer(ast) {
  const scope = null;
  const state = {code: new Buffer, isMain: true};

  traverse(ast, visitor, scope, state);

  return {code: state.code.getWithMain()};
};
