const isInjected = {};

module.exports = {

  getStringFormat() {
    if (isInjected['getStringFormat']) {
      return;
    }

    isInjected['getStringFormat'] = true;

    return `data $stringFmt = { b "%s\\n" }`;
  },

  getIntegerFormat() {
    if (isInjected['getIntegerFormat']) {
      return;
    }

    isInjected['getIntegerFormat'] = true;

    return `data $integerFmt = { b "%d\\n" }`;
  },

};
