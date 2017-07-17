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

let i = 0;
function generateGlobalIdentifier() {
  i++;
  return 'i' + i;
}

function printInstructions(instructions: [Instruction]): string {
  return instructions.reduce((acc: string, i: Instruction) => {
    let str = '';

    if (i.result) {
      str += `%${i.result} =${i.type} `;
    }

    str += `${i.name} ${i.left}`;

    if (i.right) {
      str += `${i.right}`;
    }

    str += '\n';

    return acc + str;
  }, '');
}

module.exports = {panic, getFlowTypeAtPos, generateGlobalIdentifier, printInstructions};
