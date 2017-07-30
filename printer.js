const traverse = require('babel-traverse').default;
const assert = require('assert');
const t = require('babel-types');
// const dedent = require('dedent');
// const runtime = require('./runtime');
const genFunction = require('./IL/functions');
const genBlock = require('./IL/blocks');
const ILConsoleLog = require('./IL/console.log');
const {integerEqInteger, stringEqString} = require('./IL/comparisons');
const {createCondition} = require('./IL/conditions');
const {writeLocal, createLocalVariable, createStringData, createLocalNumberData} = require('./IL/variable');
const {createOperation} = require('./IL/builtin/arithmetic');
const {maxNumber} = require('./IL/stdlib/number');
const {printInstructions, generateGlobalIdentifier, getFlowTypeAtPos, panic} = require('./utils');

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

  appendInstructions(i: [Instruction]) {
    this._buf.push(printInstructions(i));
  }

  appendGlobal(str) {
    this._bufGlobal.push(str);
  }

  appendGlobalInstructions(i: [Instruction]) {
    this._bufGlobal.push(printInstructions(i));
  }

  appendMain(str) {
    this._bufMain.push(str);
  }

  appendMainInstructions(i: [Instruction]) {
    this._bufMain.push(printInstructions(i));
  }

}

const visitor = {
  noScope: true,

  VariableDeclaration(path, {code, isMain}) {
    const [declaration] = path.node.declarations;
    const appendInstructions = (isMain ? code.appendMainInstructions : code.appendInstructions).bind(code);

    if (t.isNumericLiteral(declaration.init)) {

      appendInstructions(createLocalNumberData(declaration.id.name, declaration.init.value));
    } else if (t.isStringLiteral(declaration.init)) {

      appendInstructions([createStringData(declaration.id.name, declaration.init.value)]);
    } else if (t.isUnaryExpression(declaration.init, {operator: '-'})) {
      // negative numberLiteral
      const {argument} = declaration.init;

      appendInstructions(createLocalNumberData(declaration.id.name, '-' + argument.value));
    } else if (t.isBinaryExpression(declaration.init)) {
      const {left, right, operator} = declaration.init;

      if (t.isIdentifier(left)) {
        left.value = '%' + left.name;
      }

      if (t.isIdentifier(right)) {
        right.value = '%' + right.name;
      }

      const op = createOperation(operator, left.value, right.value);
      const store = writeLocal(declaration.id.name, '%' + op[1].result);

      appendInstructions([
        ...createLocalNumberData(declaration.id.name, '0'),
        ...op,
        store,
      ]);
    } else {
      return panic(`Unsupported type (${declaration.id.type} = ${declaration.init.type})`, declaration.id.loc);
    }
  },

  MemberExpression(path, {code, isMain}) {
    const {object, property} = path.node;
    const appendInstructions = (isMain ? code.appendMainInstructions : code.appendInstructions).bind(code);

    if (object.mame === 'Number' && property.name === 'MAX_VALUE') {
      appendInstructions(maxNumber());
    }
  },

  CallExpression(path, {code, isMain}) {
    const {callee} = path.node;
    const id = generateGlobalIdentifier();

    const append = (isMain ? code.appendMain : code.append).bind(code);
    const appendInstructions = (isMain ? code.appendMainInstructions : code.appendInstructions).bind(code);

    if (
      t.isMemberExpression(callee) &&
      callee.object.name === 'console' &&
      callee.property.name === 'log'
    ) {
      ILConsoleLog(path, id, append, code, appendInstructions);
    } else {
      const args = path.node.arguments.map((id) => {
        // FIXME(sven): how to get the type of this node?
        // Was created by a plugin

        // const type = getFlowTypeAtPos(id.loc);
        const type = 'number';

        if (type === 'number') {
          return 'w %' + id.name;
        } else {
          return panic('Unsupported type', id.loc);
        }
      });

      append(`call $${callee.name}(${args.join(',')})`);
    }
  },

  FunctionDeclaration(path, {code}) {
    const {id, body} = path.node;
    let {params} = path.node;

    const state = {isMain: false, code: new Buffer};

    traverse(body, visitor, null, state);

    if (params.length > 0) {

      params = params.map(function (param) {
        const type = getFlowTypeAtPos(param.loc);

        if (type === 'number') {
          return 'w %' + param.name;
        } else {
          return panic('Unsupported type', param.loc);
        }

      });
    }

    code.append(genFunction._function(id.name,
      state.code.get(),
      'w',
      params,
    ));

    code.appendGlobal(state.code.getGlobals());

    path.skip();
  },

  WhileStatement(path, {code, isMain}) {
    const {body, test} = path.node;
    const append = (isMain ? code.appendMain : code.append).bind(code);
    const appendInstructions = (isMain ? code.appendMainInstructions : code.appendInstructions).bind(code);

    const continueId = 'continue' + generateGlobalIdentifier();
    const loopId = 'loop' + generateGlobalIdentifier();
    const conditionId = 'condition' + generateGlobalIdentifier();

    const state = {isMain: false, code: new Buffer};

    append(genBlock.empty(conditionId));

    const eq = createCondition(t, test);
    appendInstructions(eq);

    // Loop or continue
    append(`jnz ${eq[eq.length - 1].result}, @${loopId}, @${continueId}`);

    // Loop body
    traverse(body, visitor, null, state);

    append(genBlock.block(loopId, state.code.get()));
    code.appendGlobal(state.code.getGlobals());

    append('jmp @' + conditionId);

    append(genBlock.empty(continueId));
    path.skip();
  },

  AssignmentExpression(path, {code, isMain}) {
    const appendInstructions = (isMain ? code.appendMainInstructions : code.appendInstructions).bind(code);

    const localVar = createLocalVariable(t, path.node);

    // Rename old access to new variable
    // path.scope.rename(path.node.left.name, localVar.result);

    appendInstructions(localVar);
  },

  IfStatement(path, {code, isMain}) {
    const {test, alternate, consequent} = path.node;

    const append = (isMain ? code.appendMain : code.append).bind(code);
    const appendInstructions = (isMain ? code.appendMainInstructions : code.appendInstructions).bind(code);

    const eq = createCondition(t, test);
    const conditionId = '%' + eq[eq.length - 1].result;

    appendInstructions(eq);

    // conditional jump
    const consequentBlockid = generateGlobalIdentifier();
    const alternateBlockid = generateGlobalIdentifier();

    append(`jnz ${conditionId}, @${consequentBlockid}, @${alternateBlockid}`);

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
