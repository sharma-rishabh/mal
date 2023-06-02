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

const pr_str = (malValue, print_readably = false) => {
  if (malValue instanceof MalValue) return malValue.pr_str();
  if (typeof malValue === "function") return "#<function>";

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

  pr_str() {
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
    if (!(otherValue instanceof MalList)) return false;
    return deepEqual(this.value, otherValue.value);
  }

  isEmpty() {
    return this.value.length === 0;
  }

  pr_str() {
    return "(" + this.value.map(pr_str).join(" ") + ")";
  }
}

class MalVector extends MalValue {
  constructor(value) {
    super(value);
  }

  equals(otherValue) {
    if (!(otherValue instanceof MalVector)) return false;
    return deepEqual(this.value, otherValue.value);
  }

  pr_str() {
    return "[" + this.value.map(pr_str).join(" ") + "]";
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
    if (!string.endsWith('"')) {
      throw "Unclosed double quote";
    }
    const str = string.slice(1).slice(0, -1);
    return new MalString(str);
  }

  pr_str() {
    return `\"${this.value}\"`;
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

  pr_str() {
    return "nil";
  }
}

class MalFunction extends MalValue {
  constructor(ast, bindings, env) {
    super(ast);
    this.bindings = bindings;
    this.env = env;
  }

  pr_str() {
    return "<#function>";
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
  pr_str,
  are_mal_values,
};
