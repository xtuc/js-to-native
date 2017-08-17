function fibonacci() {
  var num = 10;
  var a = 1, b = 0, temp = 0;

  while (num >= 0) {
    temp = a;
    a = a + b;
    b = temp;
    num--;

    console.log(b);
  }

  return b;
}

fibonacci();

