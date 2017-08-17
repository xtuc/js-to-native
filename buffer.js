const genFunction = require('./IL/functions');
const {printInstructions} = require('./utils');

class Buffer {

  constructor() {
    this._buf = [];
    this._bufMain = [];
    this._bufGlobal = [];
  }

  getWithMain() {

    const main = genFunction.main(
      this._bufMain.join('\n')
    );

    return this._bufGlobal.join('\n') + '\n' + this._buf.join('\n') + '\n' + main;
  }

  get() {
    return this._buf.join('\n');
  }

  getMain() {
    return this._bufMain.join('\n');
  }

  getGlobals() {
    return this._bufGlobal.join('\n');
  }

  append(str) {
    this._buf.push(str);
  }

  appendInstructions(i: [Instruction]) {
    this._buf.push(printInstructions(i));
  }

  appendGlobal(str) {
    this._bufGlobal.push(str);
  }

  appendGlobalInstructions(i: [Instruction]) {
    this._bufGlobal.push(printInstructions(i));
  }

  appendMain(str) {
    this._bufMain.push(str);
  }

  appendMainInstructions(i: [Instruction]) {
    this._bufMain.push(printInstructions(i));
  }

}

module.exports = Buffer;
