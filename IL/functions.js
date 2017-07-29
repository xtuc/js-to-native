const dedent = require('dedent');

function _function(name, body, returnType = 'w', args = []) {

  return dedent`
    function ${returnType} $${name}(${args.join(',')}) {
      @start
        ${body}
        ret 0
    }
  `;
}

function main(body) {
  return 'export ' +  _function('main', body);
}

module.exports = {_function, main};
