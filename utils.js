const {readFileSync} = require('fs');
const codeFrame = require('babel-code-frame').codeFrameColumns;
const {execFileSync} = require('child_process');
const flow = require('flow-bin');

const FILENAME = 'test.js';

function panic(msg, loc) {
  const code = readFileSync(FILENAME, 'utf8');

  console.log(codeFrame(code, loc));

  throw new Error(msg);
}

function getFlowTypeAtPos(loc) {
  const {line, column} = loc.end;

  const stdout = execFileSync(flow, ['type-at-pos', FILENAME, line, column]);

  if (stdout.toString().match(/\(unknown\)/)) {
    panic('Missing type annotation', loc);
  } else {
    const firstLine = stdout.toString().split('\n')[0];
    return firstLine;
  }
}

module.exports = {panic, getFlowTypeAtPos};
