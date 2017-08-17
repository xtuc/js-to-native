// declare function GC_malloc(nbBytes: number): number;

// function fibonacci() {
//   var num = 10;
//   var a = 1, b = 0, temp = 0;

//   while (num >= 0) {
//     temp = a;
//     a = a + b;
//     b = temp;
//     num--;

//     console.log(b);
//   }

//   return b;
// }

// fibonacci();

// const foo = GC_malloc(2);

// console.log(foo);

declare function test(number, number, number): number;
declare function log(any): any;

const foo = test(1, 2, 3);
