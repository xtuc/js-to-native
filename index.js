const babel = require('babel-core');
const printer = require('./printer');

const options = {
  parserOpts: {
    plugins: [
      'flow'
    ]
  },
  generatorOpts: {
    generator: printer
  },
};

const code = `
// var foo: string = "foo bar test";
var foo: number = 8;
// var foo = 1 + 2;
console.log(foo);
console.log("foo");
console.log(9);

console.log(1 - 2);
console.log(1 + 2);
console.log(1 / 2);
console.log(1 * 2);

function test() {

}
`;

const result = babel.transform(code, options);
console.log(result.code);

