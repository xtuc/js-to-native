const traverse = require('babel-traverse').default;
const t = require('babel-types');
const genFunction = require('./IL/functions');
const {pointers} = require('./IL/cache');
const {createArguments} = require('./IL/functions');
const genBlock = require('./IL/blocks');
const ILConsoleLog = require('./IL/console.log');
const {createCondition} = require('./IL/conditions');
const {writeLocal, createLocalVariable, createStringData, createLocalNumberData} = require('./IL/variable');
const {createOperation} = require('./IL/builtin/arithmetic');
const {createStrictComparaison} = require('./IL/comparisons');
const {maxNumber, negateNumber} = require('./IL/stdlib/number');
const {createComment} = require('./IL/comments.js');
const {generateGlobalIdentifier, getFlowTypeAtPos, panic} = require('./utils');
const Buffer = require('./buffer');

const visitor = {
  noScope: true,

  VariableDeclaration(path, {code, isMain}) {
    const [declaration] = path.node.declarations;
    const append = (isMain ? code.appendMain : code.append).bind(code);
    const appendInstructions = (isMain ? code.appendMainInstructions : code.appendInstructions).bind(code);

    if (process._debug === true) {
      const source = path.getSource();

      if (source) {
        appendInstructions([
          createComment(source)
        ]);
      } else {
        appendInstructions([
          createComment('VariableDeclaration')
        ]);
      }
    }

    // Generated during AST traversal
    if (declaration.id._ignore === true) {
      return path.skip();
    }

    pointers.add(declaration.id.name);

    if (t.isNumericLiteral(declaration.init)) {

      appendInstructions(createLocalNumberData(declaration.id.name, declaration.init.value));
    } else if (t.isStringLiteral(declaration.init)) {

      appendInstructions([createStringData(declaration.id.name, declaration.init.value)]);
    } else if (t.isUnaryExpression(declaration.init, {operator: '-'})) {
      const {argument} = declaration.init;

      const negativeValue = negateNumber(argument.value);
      const localVar = createLocalNumberData(declaration.id.name, '%' + negativeValue.result);

      appendInstructions([
        negativeValue,
        ...localVar
      ]);
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
          createStrictComparaison(declaration.id.name, left.value, right.value),
        ]);

      } else { // It's arithmetic

        const op = createOperation(operator, left.value, right.value);
        const store = writeLocal(declaration.id.name, '%' + op[op.length - 1].result);

        appendInstructions([
          ...createLocalNumberData(declaration.id.name, '0'),
          ...op,
          store,
        ]);
      }

      path.skip();
    } else if (t.isCallExpression(declaration.init)) {
      const {callee} = declaration.init;
      const id = '%' + generateGlobalIdentifier();
      const args = createArguments(t, appendInstructions, declaration.init.arguments, path);

      append(`${id} =l call $${callee.name}(${args.join(', ')})`),

      appendInstructions(createLocalNumberData(declaration.id.name, id));
      path.skip();
    } else {
      return panic(
        `Unsupported type (${declaration.id.type} = ${declaration.init.type})`,
         declaration.id.loc
      );
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

    if (process._debug === true) {
      const source = path.getSource();

      if (source) {
        appendInstructions([
          createComment(source)
        ]);
      } else {
        appendInstructions([
          createComment('CallExpression')
        ]);
      }
    }

    if (
      t.isMemberExpression(callee) &&
      callee.object.name === 'console' &&
      callee.property.name === 'log'
    ) {
      ILConsoleLog(path, id, append, code, appendInstructions);

      path.skip();
    } else if (t.isFunctionExpression(callee)) {
      const {body} = callee;
      let {params} = callee;

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

      const state = {isMain: false, code: new Buffer};
      const id = generateGlobalIdentifier();

      traverse(body, visitor, null, state);

      code.append(genFunction._function(id,
        state.code.get(),
        'w',
        params,
      ));

      code.appendGlobal(state.code.getGlobals());

      append(`call $${id}()`);

      path.skip();
    } else {
      const args = createArguments(t, appendInstructions, path.node.arguments, path);

      append(`call $${callee.name}(${args.join(',')})`);

      path.skip();
    }
  },

  BinaryExpression(path, {code, isMain}) {
    const appendInstructions = (isMain ? code.appendMainInstructions : code.appendInstructions).bind(code);
    const id = generateGlobalIdentifier();

    if (process._debug === true) {
      const source = path.getSource();

      if (source) {
        appendInstructions([
          createComment(source)
        ]);
      } else {
        appendInstructions([
          createComment('BinaryExpression')
        ]);
      }
    }

    const {left, right, operator} = path.node;

    if (t.isIdentifier(left)) {
      left.value = '%' + left.name;
    }

    if (t.isIdentifier(right)) {
      right.value = '%' + right.name;
    }

    const op = createOperation(operator, left.value, right.value);
    const store = writeLocal(id, '%' + op[op.length - 1].result);

    appendInstructions([
      ...createLocalNumberData(id, '0'),
      ...op,
      store,
    ]);
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

    if (process._debug === true) {
      const source = path.getSource();

      if (source) {
        appendInstructions([
          createComment(source)
        ]);
      } else {
        appendInstructions([
          createComment('WhileStatement')
        ]);
      }
    }

    const continueId = 'continue' + generateGlobalIdentifier();
    const loopId = 'loop' + generateGlobalIdentifier();
    const conditionId = 'condition' + generateGlobalIdentifier();

    const state = {isMain: false, code: new Buffer};

    append(genBlock.empty(conditionId));

    const eq = createCondition(t, test, code.appendGlobalInstructions.bind(code));
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
    const append = (isMain ? code.appendMain : code.append).bind(code);

    if (process._debug === true) {
      const source = path.getSource();

      if (source) {
        appendInstructions([
          createComment(source)
        ]);
      } else {
        appendInstructions([
          createComment('AssignmentExpression')
        ]);
      }
    }

    if (t.isCallExpression(path.node.right)) {
      const id = t.identifier(generateGlobalIdentifier());
      const args = createArguments(t, appendInstructions, path.node.right.arguments, path);

      append(`%${id.name} =l call $${path.node.right.callee.name}(${args.join(',')})`);

      path.node.right = id;
      path.scope.push({id});
    }

    const localVar = createLocalVariable(t, path.node, appendInstructions, path);

    appendInstructions(localVar);
  },

  IfStatement(path, {code, isMain}) {
    const {test, alternate, consequent} = path.node;

    const append = (isMain ? code.appendMain : code.append).bind(code);
    const appendInstructions = (isMain ? code.appendMainInstructions : code.appendInstructions).bind(code);

    if (process._debug === true) {
      const source = path.getSource();

      if (source) {
        appendInstructions([
          createComment(source)
        ]);
      } else {
        appendInstructions([
          createComment('IfStatement')
        ]);
      }
    }

    const eq = createCondition(t, test, code.appendGlobalInstructions.bind(code));
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
