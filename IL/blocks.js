const indentString = require('indent-string');

function empty(name) {
  return block(name, '');
}

function block(name, body) {
  return '@' + name + '\n'
    + '     ' + indentString(body, 4);
}

module.exports = {block, empty};
