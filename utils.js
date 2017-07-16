const t = require('babel-types');
const {readFileSync} = require('fs');
const codeFrame = require('babel-code-frame').codeFrameColumns;

function getIdentifierType(id, loc) {
  if (typeof id.typeAnnotation === 'undefined') {
    return panic('Missing type annotation', loc);
  }

  const annotation = id.typeAnnotation.typeAnnotation;

  if (t.isStringTypeAnnotation(annotation)) {
    return 'string';
  } else if (t.isNumberTypeAnnotation(annotation)) {
    return 'integer';
  } else {
    throw new Error(`Unexpected type annotation: ${annotation.type}`);
  }
}

function panic(msg, loc) {
  const FILENAME = 'test.js';
  const code = readFileSync(FILENAME, 'utf8');

  console.log(codeFrame(code, loc));

  throw new Error(msg);
}

module.exports = {panic, getIdentifierType};
