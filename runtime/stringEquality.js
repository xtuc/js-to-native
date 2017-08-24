declare function _c_isStringEqual(l: any, r: any): number;

function isStringEqual(l: string, r: string): number {
  return _c_isStringEqual(l, r);
}
