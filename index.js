const babel = require('babel-core');
const printer = require('./AST/printer/index');
const {readFileSync} = require('fs');
const cp = require('child_process');
const decache = require('decache');
const flow = require('flow-bin');

const FLOW_NO_ERRORS = /No errors!/;
let flowHasError = false;

function run(filename, cb, {debug} = {}) {
  process._filename = filename;
  process._globalIdentifierCount = 0;
  process._debug = debug;

  decache('./IL/cache');

  const options = {
    plugins: [
      require('./AST/plugins/flattenVariableDeclarations'),
      require('./AST/plugins/booleanToInteger'),
      require('./AST/plugins/updateExpressionToAssignement'),
      'transform-es2015-arrow-functions',
    ],
    parserOpts: {
      plugins: [
        'flow'
      ]
    },
    generatorOpts: {
      generator: printer
    },
  };

  const code = readFileSync(filename, 'utf8');

  const child = cp.spawn(flow, ['check-contents', '--color=always']);

  child.stdin.write(code);
  child.stdin.end();

  child.stdout.on('data', function (data) {

    if (data.toString().match(FLOW_NO_ERRORS)) {
      flowHasError = false;
    } else {
      flowHasError = true;

      console.log('Type error: ' + data);
    }
  });

  child.stdout.on('end', () => {

    if (!flowHasError) {
      transpileIL();
    } else {
      process.exit(1);
    }
  });

  function transpileIL() {
    const result = babel.transform(code, options);

    cb(result.code);
  }
}

module.exports = run;
