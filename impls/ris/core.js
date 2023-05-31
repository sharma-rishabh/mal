const { Env } = require("./env.js");
const { pr_str, MalSymbol, MalList, MalVector, MalNil } = require("./types.js");

const greater_than = ([prev_element, prev_res], new_element) => {
  return [new_element, prev_res && new_element > prev_element];
};

const greater_than_equal_to = ([prev_element, prev_res], new_element) => {
  return [new_element, prev_res && new_element >= prev_element];
};

const less_than = ([prev_element, prev_res], new_element) => {
  return [new_element, prev_res && new_element < prev_element];
};

const less_than_equal_to = ([prev_element, prev_res], new_element) => {
  return [new_element, prev_res && new_element <= prev_element];
};

const equal_to = ([prev_element, prev_res], new_element) => {
  return [new_element, prev_res && new_element === prev_element];
};

const prn = (args, postfix = "") => {
  console.log(...args.map(pr_str), postfix);
  return new MalNil();
};

const print_string = (args) => {
  const string_values = args.map(pr_str);
  console.log(`"${string_values.join(" ")}"`);
  return new MalNil();
};

function isCountable(list) {
  ``;
  return list instanceof MalVector || list instanceof MalList;
}

const count = (countable) => {
  if (countable instanceof MalNil) return 0;
  if (!isCountable(countable)) {
    throw countable + " not countable";
  }
  return countable.value.length;
};

const env = new Env();
env.set(new MalSymbol("+"), (...args) => args.reduce((a, b) => a + b));
env.set(new MalSymbol("-"), (...args) => args.reduce((a, b) => a - b));
env.set(new MalSymbol("*"), (...args) => args.reduce((a, b) => a * b));
env.set(new MalSymbol("/"), (...args) => args.reduce((a, b) => a / b));
env.set(
  new MalSymbol(">"),
  (...args) => args.reduce(greater_than, [-Infinity, true])[1]
);
env.set(
  new MalSymbol(">="),
  (...args) => args.reduce(greater_than_equal_to, [-Infinity, true])[1]
);
env.set(
  new MalSymbol("<"),
  (...args) => args.reduce(less_than, [Infinity, true])[1]
);
env.set(
  new MalSymbol("<="),
  (...args) => args.reduce(less_than_equal_to, [Infinity, true])[1]
);
env.set(
  new MalSymbol("="),
  (...args) => args.reduce(equal_to, [args[0], true])[1]
);

env.set(new MalSymbol("vector"), (...args) => new MalVector(args));
env.set(new MalSymbol("list"), (...args) => new MalList(args));
env.set(new MalSymbol("list?"), (list) => list instanceof MalList);
env.set(new MalSymbol("count"), count);
env.set(new MalSymbol("empty?"), (arg) => 0 === count(arg));

env.set(new MalSymbol("prn"), (...args) => prn(args));
env.set(new MalSymbol("pr-str"), (...args) => print_string(args));
env.set(new MalSymbol("println"), (...args) => prn(args, "\n"));

module.exports = { env };
