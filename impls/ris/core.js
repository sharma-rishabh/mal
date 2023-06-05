const { Env } = require("./env.js");
const {
  pr_str,
  MalSymbol,
  MalList,
  MalVector,
  MalNil,
  are_mal_values,
} = require("./types.js");

const greater_than = ([prev_element, prev_res], new_element) => {
  return [new_element, prev_res && prev_element > new_element];
};

const greater_than_equal_to = ([prev_element, prev_res], new_element) => {
  console.log(prev_element, new_element);
  return [new_element, prev_res && prev_element >= new_element];
};

const less_than = ([prev_element, prev_res], new_element) => {
  return [new_element, prev_res && prev_element < new_element];
};

const less_than_equal_to = ([prev_element, prev_res], new_element) => {
  return [new_element, prev_res && prev_element <= new_element];
};

const equal_to = ([prev_element, prev_res], new_element) => {
  let res = new_element === prev_element;

  if (are_mal_values(prev_element, new_element)) {
    console.log(prev_element, new_element);
    res = prev_element.equals(new_element);
  }

  return [new_element, prev_res && res];
};

const prn = (args, postfix = "") => {
  console.log(...args.map(pr_str), postfix);
  return new MalNil();
};

const str = (args) => {
  const string_values = args.map(pr_str);
  return `"${string_values.join("")}"`;
};

const print_string = (args) => {
  console.log(str(args));
  return new MalNil();
};

function isCountable(list) {
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
  (...args) => args.reduce(greater_than, [Infinity, true])[1]
);
env.set(
  new MalSymbol(">="),
  (...args) => args.reduce(greater_than_equal_to, [Infinity, true])[1]
);
env.set(
  new MalSymbol("<"),
  (...args) => args.reduce(less_than, [-Infinity, true])[1]
);
env.set(
  new MalSymbol("<="),
  (...args) => args.reduce(less_than_equal_to, [-Infinity, true])[1]
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
env.set(new MalSymbol("str"), (...args) => str(args));
env.set(new MalSymbol("pr-str"), (...args) => print_string(args));
env.set(new MalSymbol("println"), (...args) => prn(args, "\n"));

module.exports = { env };
