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
  MalSequence,
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

function handle_let(ast, env) {
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

const create_fn_env = (binds, exprs, outer) => {
  const env = new Env(outer);

  for (let i = 0; i < binds.length; i++) {
    if (binds[i].value === "&") {
      env.set(binds[i + 1], new MalList(exprs.slice(i)));
      return env;
    }
    env.set(binds[i], exprs[i]);
  }
  return env;
};

const handle_fn = (bindings, statements, env) => {
  const doForms = new MalList([new MalSymbol("do"), ...statements]);
  const fn = (...expers) => {
    const fn_env = create_fn_env(bindings, expers, env);
    return EVAL(doForms, fn_env);
  };
  return new MalFunction(doForms, bindings, env, fn);
};

function handle_def(env, ast) {
  env.set(ast.value[1], EVAL(ast.value[2], env));
  return env.get(ast.value[1]);
}

function handle_def_macro(ast, env) {
  const macro = EVAL(ast.value[2], env);
  macro.isMacro = true;
  env.set(ast.value[1], macro);
  return env.get(ast.value[1]);
}

const is_macro_call = (ast, env) => {
  try {
    return (
      ast instanceof MalList &&
      !ast.isEmpty() &&
      ast.value[0] instanceof MalSymbol &&
      env.get(ast.value[0]).isMacro
    );
  } catch {
    return false;
  }
};

const macroexpand = (ast, env) => {
  while (is_macro_call(ast, env)) {
    const macro = env.get(ast.value[0]);
    ast = macro.apply(null, ast.value.slice(1));
  }
  return ast;
};

const quasiquote = (ast) => {
  if (ast instanceof MalList && ast.beginsWith("unquote")) {
    return ast.value[1];
  }

  if (ast instanceof MalSequence) {
    let result = new MalList([]);
    for (let index = ast.value.length - 1; index >= 0; index--) {
      const element = ast.value[index];
      if (element instanceof MalList && element.beginsWith("splice-unquote")) {
        result = new MalList([
          new MalSymbol("concat"),
          element.value[1],
          result,
        ]);
      } else {
        result = new MalList([
          new MalSymbol("cons"),
          quasiquote(element),
          result,
        ]);
      }
    }
    if (ast instanceof MalList) return result;
    return new MalList([new MalSymbol("vec"), result]);
  }

  if (ast instanceof MalSymbol) {
    return new MalList([new MalSymbol("quote"), ast]);
  }
  return ast;
};

const EVAL = (ast, env) => {
  while (true) {
    if (!(ast instanceof MalList)) {
      return eval_ast(ast, env);
    }

    if (ast.isEmpty()) {
      return ast;
    }

    ast = macroexpand(ast, env);
    if (!(ast instanceof MalList)) {
      return eval_ast(ast, env);
    }

    switch (ast.value[0].value) {
      case "def!":
        return handle_def(env, ast);
      case "defmacro!":
        return handle_def_macro(ast, env);
      case "macroexpand":
        return macroexpand(ast.value[1], env);
      case "let*":
        [env, ast] = handle_let(ast, env);
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
      case "quote":
        return ast.value[1];
      case "quasiquoteexpand":
        return quasiquote(ast.value[1]);
      case "quasiquote":
        ast = quasiquote(ast.value[1]);
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

const PRINT = (str) => pr_str(str, true);

const rep = (str) => PRINT(EVAL(READ(str), env));

const createREPLEnv = () => {
  rep("(def! not (fn* (a) (if a false true)))");
  env.set(new MalSymbol("eval"), (ast) => EVAL(ast, env));
  rep(
    '(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\nnil)")))))'
  );
  rep(
    "(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list 'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw \"odd number of forms to cond\")) (cons 'cond (rest (rest xs)))))))"
  );
};

const repl = () => {
  createREPLEnv();
  rl.question("user> ", (line) => {
    try {
      console.log(rep(line));
    } catch (error) {
      console.log(error);
    }
    repl();
  });
};

if (process.argv.length >= 3) {
  rep('(load-file ("' + process.argv[2] + ")");
  rl.close();
} else {
  repl();
}
