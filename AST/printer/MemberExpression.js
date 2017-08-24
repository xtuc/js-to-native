const IL = require('../../IL');
const {getFlowTypeAtPos} = require('../../utils');

module.exports = function(path, {code, isMain}) {
  const {object, property} = path.node;
  const appendInstructions = (isMain
    ? code.appendMainInstructions
    : code.appendInstructions).bind(code);

  // if (object.mame === 'Number' && property.name === 'MAX_VALUE') {
  //   appendInstructions(IL.stdlib.maxNumber());
  // }

  // console.log(object.name + '_' + property.name);
  // console.log(getFlowTypeAtPos(property.loc));
};
