// // // var foo: string = "foo bar test";
// const foo = 8;
// // // var foo = 1 + 2;
// console.log(foo);
// console.log('foo');
// console.log(9);

// console.log(1 + 2);
// console.log(1 - 2);
// console.log(1 / 2);
// console.log(1 * 2);

// function ab() {
//   console.log('test function');
// }

// const a: number = 1;

// if (1 === 1) {
//   console.log('consequent');
// } else {
//   console.log('alternate');
// }

// ab();

// while (true) {
//   console.log('loop test');
// }

function fibonacci() {
  var num = 10;
  var a = 1, b = 0, temp = 0;

  while (num >= 0) {
    temp = a;
    a = a + b;
    b = temp;
    num--;

    console.log(b);
  }

  return b;
}

fibonacci()
