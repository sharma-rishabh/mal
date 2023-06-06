const fs = require("fs");
const { Env } = require("./env.js");
const { read_str } = require("./reader.js");
const {
  pr_str,
  MalSymbol,
  MalList,
  MalVector,
  MalNil,
  are_mal_values,
  MalString,
  MalAtom,
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

const str = (args) => {
  const string_values = args.map((x) => pr_str(x, false)).join("");
  return new MalString(string_values);
};

const print = (args, printReadably) => {
  console.log(...args.map((arg) => pr_str(arg, printReadably)));
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
env.set(new MalSymbol("read-string"), (string) => read_str(string.value));
env.set(new MalSymbol("slurp"), (fileName) => {
  return new MalString(fs.readFileSync(fileName.value, "utf-8"));
});
env.set(new MalSymbol("atom"), (value) => new MalAtom(value));
env.set(new MalSymbol("atom?"), (value) => value instanceof MalAtom);
env.set(new MalSymbol("deref"), (atom) => atom.deref());
env.set(new MalSymbol("reset!"), (atom, value) => atom.reset(value));
env.set(new MalSymbol("swap!"), (atom, f, ...args) => atom.swap(f, args));
env.set(new MalSymbol("*ARGV*"), new MalList(process.argv.slice(2)));
env.set(new MalSymbol("prn"), (...args) => print(args, true));
env.set(new MalSymbol("str"), (...args) => str(args));
env.set(new MalSymbol("pr-str"), (...args) => {
  const str = args.map((arg) => pr_str(arg, true)).join(" ");
  return MalString.createString(str);
});
env.set(new MalSymbol("println"), (...args) => print(args, false));

module.exports = { env };
