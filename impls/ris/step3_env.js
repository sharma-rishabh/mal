const readline = require("readline");
const { read_str } = require("./reader.js");
const { pr_str, MalSymbol, MalList, MalVector } = require("./types.js");
const { Env } = require("./env.js");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const eval_ast = (ast, env) => {
  if (ast instanceof MalSymbol) {
    return env.get(ast);
  }

  if (ast instanceof MalList) {
    const newAst = ast.value.map((x) => EVAL(x, env));
    return new MalList(newAst);
  }

  if (ast instanceof MalVector) {
    const newAst = ast.value.map((x) => EVAL(x, env));
    return new MalVector(newAst);
  }

  return ast;
};

const READ = (str) => {
  return read_str(str);
};

const partitioner = function (sizeOfChunk, partitions, element) {
  if (partitions[partitions.length - 1].length !== sizeOfChunk) {
    partitions[partitions.length - 1].push(element);
    return partitions;
  }
  partitions.push([element]);
  return partitions;
};

const partition = function (array, chunkSize) {
  if (array.length === 0 || chunkSize === 0) {
    return [];
  }
  return array.reduce(
    function (partitions, element) {
      return partitioner(chunkSize, partitions, element);
    },
    [[]]
  );
};

const EVAL = (ast, env) => {
  if (!(ast instanceof MalList)) {
    const evaluation = eval_ast(ast, env);
    return evaluation;
  }

  if (ast.isEmpty()) {
    return ast;
  }

  switch (ast.value[0].value) {
    case "def!":
      env.set(ast.value[1], EVAL(ast.value[2], env));
      return env.get(ast.value[1]);
    case "let*":
      lexical_scope = new Env(env);
      bindings = partition(ast.value[1].value, 2);
      bindings.forEach(([key, form]) =>
        lexical_scope.set(key, EVAL(form, lexical_scope))
      );
      return EVAL(ast.value[2], lexical_scope);
  }

  const [fn, ...args] = eval_ast(ast, env).value;
  return fn.apply(null, args);
};

const PRINT = (str) => pr_str(str);

const env = new Env();
env.set(new MalSymbol("+"), (...args) => args.reduce((a, b) => a + b));
env.set(new MalSymbol("-"), (...args) => args.reduce((a, b) => a - b));
env.set(new MalSymbol("*"), (...args) => args.reduce((a, b) => a * b));
env.set(new MalSymbol("/"), (...args) => args.reduce((a, b) => a / b));
env.set(new MalSymbol("vector"), (...args) => new MalVector(args));
env.set(new MalSymbol("list"), (...args) => new MalList(args));

const rep = (str) => PRINT(EVAL(READ(str), env));

const repl = () =>
  rl.question("user> ", (line) => {
    try {
      console.log(rep(line));
    } catch (error) {
      console.log(error);
    }
    repl();
  });

repl();
