const IL = require('../../IL');

module.exports = function(path, {code, isMain}) {
  const {object, property} = path.node;
  const appendInstructions = (isMain
    ? code.appendMainInstructions
    : code.appendInstructions).bind(code);

  if (object.mame === 'Number' && property.name === 'MAX_VALUE') {
    appendInstructions(IL.stdlib.maxNumber());
  }
};
