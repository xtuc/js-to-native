function createComment(msg): Instruction {
  return {
    comment: msg,
  };
}

module.exports = {
  createComment,
};
