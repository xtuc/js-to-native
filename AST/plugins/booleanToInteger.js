module.exports = function(babel) {
  const {types: t} = babel;

  return {
    name: 'booleanToInteger',

    visitor: {
      BooleanLiteral(path) {
        const newNode = t.numberLiteral(+path.node.value);
        newNode.loc = path.node.loc;

        path.replaceWith(newNode);
      },
    },
  };
};
