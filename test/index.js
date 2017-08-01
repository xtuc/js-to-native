const glob = require('glob');
const run = require('../index');
const path = require('path');
const {writeFileSync, readFileSync} = require('fs');
const diff = require('jest-diff');
const {NO_DIFF_MESSAGE} = require('jest-diff/build/constants');

const testSuites = glob.sync('test/fixtures/**/actual.js');

testSuites.forEach((suite) => {

  it(suite, () => new Promise((resolve) => {
    function check(code) {
      const expectedFile = path.join(path.dirname(suite), 'expected.ssa');

      let expected;
      try {
        expected = readFileSync(expectedFile, 'utf8');
      } catch (e) {
        expected = code;

        writeFileSync(expectedFile, code);
      }

      const out = diff(code.trim(), expected.trim());

      if (out !== null && out !== NO_DIFF_MESSAGE) {
        throw new Error('\n' + out);
      }

      resolve();
    }

    run(suite, check);
  }));
});
