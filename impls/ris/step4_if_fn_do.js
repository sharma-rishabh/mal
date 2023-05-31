const readline = require("readline");
const { read_str } = require("./reader.js");
const { pr_str, MalSymbol, MalList, MalVector, MalNil } = require("./types.js");
const { Env } = require("./env.js");
const { env } = require("./core.js");

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

function handle_let(env, ast) {
  lexical_scope = new Env(env);
  bindings = partition(ast.value[1].value, 2);
  bindings.forEach(([key, form]) =>
    lexical_scope.set(key, EVAL(form, lexical_scope))
  );
  return EVAL(ast.value[2], lexical_scope);
}

function handle_do(ast, env) {
  let res;
  for (let index = 1; index < ast.value.length; index++) {
    res = EVAL(ast.value[index], env);
  }
  return res;
}

function isTrue(predicate, env) {
  const evaluated_pred = EVAL(predicate, env);
  return !(evaluated_pred === false || evaluated_pred instanceof MalNil);
}

function handle_if(ast, env) {
  const predicate = ast.value[1];
  const if_true = ast.value[2];
  const if_false = ast.value[3];

  if (isTrue(predicate, env)) {
    return EVAL(if_true, env);
  }
  if (if_false === undefined) {
    return new MalNil();
  }
  return EVAL(if_false, env);
}

const create_fn_env = (bindings, expers, outer) => {
  if (bindings.length !== expers.length) {
    throw "Invalid number of arguments";
  }

  const env = new Env(outer);

  for (let index = 0; index < bindings.length; index++) {
    const binding = bindings[index];
    const exper = expers[index];
    env.set(binding, exper);
  }
  return env;
};

const handle_fn = (bindings, statements, env) => {
  return (...expers) => {
    const fn_env = create_fn_env(bindings, expers, env);
    return EVAL(new MalList([new MalSymbol("do"), ...statements]), fn_env);
  };
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
      return handle_let(env, ast);
    case "do":
      return handle_do(ast, env);
    case "if":
      return handle_if(ast, env);
    case "fn*":
      return handle_fn(ast.value[1].value, ast.value.slice(2), env);
  }

  const [fn, ...args] = eval_ast(ast, env).value;
  return fn.apply(null, args);
};

const PRINT = (str) => pr_str(str);

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
