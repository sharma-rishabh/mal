const readline = require("readline");
const { read_str } = require("./reader.js");
const {
  pr_str,
  MalSymbol,
  MalList,
  MalVector,
  MalNil,
  MalValue,
  MalFunction,
} = require("./types.js");
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
  forms = ast.value.slice(2);

  bindings = partition(ast.value[1].value, 2);
  bindings.forEach(([key, form]) =>
    lexical_scope.set(key, EVAL(form, lexical_scope))
  );

  doForms = new MalList([new MalSymbol("do"), ...forms]);
  return [lexical_scope, doForms];
}

function handle_do(ast, env) {
  for (let index = 1; index < ast.value.length - 1; index++) {
    EVAL(ast.value[index], env);
  }
  return ast.value[ast.value.length - 1];
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
    return if_true;
  }
  if (if_false === undefined) {
    return new MalNil();
  }
  return if_false;
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
  const doForms = new MalList([new MalSymbol("do"), ...statements]);
  // fn = (...expers) => {
  //   const fn_env = create_fn_env(bindings, expers, env);
  //   return EVAL(doForms, fn_env);
  // };
  return new MalFunction(doForms, bindings, env);
};

const EVAL = (ast, env) => {
  while (true) {
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
        [env, ast] = handle_let(env, ast);
        break;
      case "do":
        ast = handle_do(ast, env);
        break;
      case "if":
        ast = handle_if(ast, env);
        break;
      case "fn*":
        ast = handle_fn(ast.value[1].value, ast.value.slice(2), env);
        break;
      default:
        const [fn, ...args] = eval_ast(ast, env).value;
        if (fn instanceof MalFunction) {
          const oldEnv = fn.env;
          const bindings = fn.bindings;
          env = create_fn_env(bindings, args, oldEnv);
          ast = fn.value;
        } else {
          return fn.apply(null, args);
        }
    }
  }
};

const PRINT = (str) => pr_str(str);

const get_value = (arg) => {
  if (arg instanceof MalValue) {
    return arg.pr_str();
  }
  return arg;
};

env.set(new MalSymbol("not"), (arg) =>
  rep(`((fn* [x] (if x false true)) ${get_value(arg)})`)
);
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
