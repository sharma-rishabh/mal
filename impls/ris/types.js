const are_mal_values = (first_element, second_element) => {
  return (
    first_element instanceof MalValue && second_element instanceof MalValue
  );
};

const areBothArrays = (element1, element2) => {
  return Array.isArray(element1) && Array.isArray(element2);
};

const deepEqual = (list1, list2) => {
  if (are_mal_values(list1, list2)) {
    return list1.equals(list2);
  }

  if (!areBothArrays(list1, list2)) {
    return list1 === list2;
  }

  if (list1.length !== list2.length) {
    return false;
  }

  for (let index = 0; index < list1.length; index++) {
    if (!deepEqual(list1[index], list2[index])) {
      return false;
    }
  }

  return true;
};

const toPrintedRepresentation = (str) =>
  str.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\"/g, '\\"');

const pr_str = (malValue, printReadably = false) => {
  if (typeof malValue === "function") return "#<function>";
  if (malValue instanceof MalValue) {
    if (printReadably && malValue instanceof MalString) {
      return `"${toPrintedRepresentation(malValue.pr_str(printReadably))}"`;
    }
    return malValue.pr_str();
  }

  return malValue.toString();
};

class MalValue {
  constructor(value) {
    this.value = value;
  }

  equals(otherValue) {
    if (!(otherValue instanceof MalValue)) return false;
    return otherValue.value === this.value;
  }

  pr_str(_) {
    return this.value.toString();
  }
}

class MalSymbol extends MalValue {
  constructor(value) {
    super(value);
  }

  equals(otherValue) {
    if (!(otherValue instanceof MalSymbol)) return false;
    return otherValue.value === this.value;
  }
}

class MalKeyword extends MalValue {
  constructor(value) {
    super(value);
  }

  equals(otherValue) {
    if (!(otherValue instanceof MalKeyword)) return false;
    return otherValue.value === this.value;
  }
}

class MalList extends MalValue {
  constructor(value) {
    super(value);
  }

  equals(otherValue) {
    if (!(otherValue instanceof MalList || otherValue instanceof MalVector))
      return false;
    return deepEqual(this.value, otherValue.value);
  }

  isEmpty() {
    return this.value.length === 0;
  }

  pr_str(print_readably) {
    return (
      "(" + this.value.map((x) => pr_str(x, print_readably)).join(" ") + ")"
    );
  }
}

class MalVector extends MalValue {
  constructor(value) {
    super(value);
  }

  equals(otherValue) {
    if (!(otherValue instanceof MalList || otherValue instanceof MalVector))
      return false;
    return deepEqual(this.value, otherValue.value);
  }

  pr_str(print_readably) {
    return (
      "[" + this.value.map((x) => pr_str(x, print_readably)).join(" ") + "]"
    );
  }
}

class MalString extends MalValue {
  constructor(value) {
    super(value);
  }

  equals(otherValue) {
    if (!(otherValue instanceof MalString)) return false;
    return otherValue.value === this.value;
  }

  static createString(string) {
    const str = string.slice(1, -1);
    const value = str.replace(/\\(.)/, (_, captured) =>
      captured === "n" ? "\n" : captured
    );
    return new MalString(value);
  }

  pr_str(_) {
    return this.value;
  }
}

class MalNil extends MalValue {
  constructor(value) {
    super(null);
  }

  equals(otherValue) {
    if (!(otherValue instanceof MalNil)) return false;
    return otherValue.value === this.value;
  }

  pr_str(_) {
    return "nil";
  }
}

class MalFunction extends MalValue {
  constructor(ast, bindings, env, fn) {
    super(ast);
    this.bindings = bindings;
    this.env = env;
    this.fn = fn;
  }

  pr_str(_) {
    return "<#function>";
  }

  apply(ctx, args) {
    return this.fn.apply(null, args);
  }
}

class MalAtom extends MalValue {
  constructor(value) {
    super(value);
  }

  pr_str(print_readably = false) {
    return "(atom " + pr_str(this.value, print_readably) + ") ";
  }

  deref() {
    return this.value;
  }

  reset(value) {
    this.value = value;
    return this.value;
  }

  swap(f, args) {
    this.value = f.apply(null, [this.value, ...args]);
    return this.value;
  }
}

module.exports = {
  MalSymbol,
  MalValue,
  MalList,
  MalVector,
  MalNil,
  MalKeyword,
  MalString,
  MalFunction,
  MalAtom,
  pr_str,
  are_mal_values,
};
