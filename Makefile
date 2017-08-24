export PATH := $(shell pwd)/node_modules/.bin:$(PATH)

TMP="./.tmp"

create-tmp:
	mkdir -p $(TMP)

compile-runtime: create-tmp
	babel-node cli.js runtime/stringEquality.js --nomain > $(TMP)/runtime.ssa

concat-runtime:
	cat $(TMP)/runtime.ssa >> out.ssa

compile-test: compile-runtime
	babel-node cli.js test.js > out.ssa
	make concat-runtime
	qbe -o asm.s out.ssa
	gcc -I/usr/lib/ runtime/*.c asm.s -lgc -o a.out

clean:
	rm -rf $(TMP)
	rm -fv *.out *.s *.ssa

run: clean compile-test
	echo "\n"
	./a.out
