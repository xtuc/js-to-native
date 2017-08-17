const {readFileSync} = require('fs');
const codeFrame = require('babel-code-frame').codeFrameColumns;
const {execFileSync} = require('child_process');
const flow = require('flow-bin');

function panic(msg, loc) {
  const code = readFileSync(process._filename, 'utf8');

  console.error(codeFrame(code, loc));

  throw new Error(msg);
}

function getFlowTypeAtPos(loc) {
  const {line, column} = loc.end;

  const stdout = execFileSync(flow, ['type-at-pos', process._filename, line, column]);

  if (stdout.toString().match(/\(unknown\)|any/)) {
    panic('Missing type annotation', loc);
  } else {
    const firstLine = stdout.toString().split('\n')[0];
    return firstLine;
  }
}

process._globalIdentifierCount = 0;
function generateGlobalIdentifier() {
  process._globalIdentifierCount++;
  return 'i' + process._globalIdentifierCount;
}

function printInstructions(instructions: [Instruction], sep: string = '\n'): string {
  return instructions.reduce((acc: string, i: Instruction, index: number) => {
    let str = '';


    // Fail fast for comment
    if (typeof i.comment !== 'undefined') {
      i.comment = i.comment.split(sep).map((s) => '# ' + s).join(sep);

      return acc + sep + i.comment;
    }

    if (i.isData) {
      str += `data `;
    }

    if (typeof i.result !== 'undefined') {

      if (i.isGlobal === true) {
        i.result = '$' + i.result;
      } else {
        i.result = '%' + i.result;
      }

      str += `${i.result} =${i.type || ''} `;
    }

    str += `${i.name} ${i.left}`;

    if (typeof i.right !== 'undefined') {
      str += `, ${i.right}`;
    }

    // avoid an extra new line at the end
    if (instructions.length - 1 !== index) {
      str += sep;
    }

    return acc + str;
  }, '');
}

module.exports = {panic, getFlowTypeAtPos, generateGlobalIdentifier, printInstructions};
