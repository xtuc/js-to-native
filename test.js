declare function GC_malloc(nbBytes: number): number;
declare function GC_malloc_atomic(nbBytes: number): number;
declare function GC_realloc(object: Object, new_size: number): number;
declare function GC_free(object: Object): void;
declare function GC_expand_hp(bytes: number): void;
declare function GC_malloc_ignore_off_page(bytes: number): void;
declare function GC_set_warn_proc(proc: Object): void;
declare function GC_enable_incremental(): void;

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

(function (a: boolean, b: string, c: number) {
  console.log(c);
})(true, '', 3);
