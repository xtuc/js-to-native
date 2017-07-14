const babel = require('babel-core');
const printer = require('./printer');

const options = {
  generatorOpts: {
    generator: printer
  },
};

const code = `
var foo = "foo bar test";
// var foo = 1 + 2;
console.log(foo);
// console.log(9);
`;

const result = babel.transform(code, options);
console.log(result.code);

