/* @flow */

type BaseType = 'w' | 'l' | 's' | 'd';

type Instruction = {|
  type?: BaseType,
  name: string,
  left: string,
  right?: string,
  result: string,
|};
