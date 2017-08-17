const pointersSet = new Set();

module.exports.pointers = {

  add(name) {
    if (this.has(name)) {
      console.log('#', 'ignoring: pointer', name, 'was already registred');
      return;
    }

    pointersSet.add(name);
  },

  has(name) {
    return pointersSet.has(name);
  },

  delete(name) {
    return pointersSet.delete(name);
  },

  clear() {
    pointersSet.clear();
  }

};
