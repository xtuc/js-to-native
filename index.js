const babel = require('babel-core');
const printer = require('./printer');
const {readFileSync} = require('fs');
const cp = require('child_process');
const flow = require('flow-bin');

const FLOW_NO_ERRORS = /No errors!/;
let flowHasError = false;

function run(filename, cb) {
  process._filename = filename;
  process._globalIdentifierCount = 0;

  const options = {
    plugins: [
      require('./AST/flattenVariableDeclarations'),
      require('./AST/updateExpressionToAssignement'),
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

    if (cb) {
      cb(result.code);
    } else {
      console.log(result.code);
    }
  }
}

module.exports = run;
