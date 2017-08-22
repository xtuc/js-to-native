module.exports = {
  comments: require('./comments'),
  variable: require('./variable'),
  conditions: require('./conditions'),
  comparisons: require('./comparisons'),

  functions: require('./functions'),
  blocks: require('./blocks'),

  builtin: {
    arithmetic: require('./builtin/arithmetic'),
  },

  stdlib: {
    number: require('./stdlib/number'),
  },

  cache: require('./cache')
};
