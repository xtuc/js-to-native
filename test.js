declare function GC_malloc(nbBytes: number): number;
declare function GC_malloc_atomic(nbBytes: number): number;
declare function GC_realloc(object: Object, new_size: number): number;
declare function GC_free(object: Object): void;
declare function GC_expand_hp(bytes: number): void;
declare function GC_malloc_ignore_off_page(bytes: number): void;
declare function GC_set_warn_proc(proc: Object): void;
declare function GC_enable_incremental(): void;
declare var window: Object;
declare var exports: Object;

// function fibonacci() {
//   var num = 50;
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

// const a = 'test';

// console.log(a);

// function isStringEqual(l: string, r: string) {
//   return l === r;
// }


function a() {
  return 100;
}
