const pr_str = (malValue) => {
  if (malValue instanceof MalValue) return malValue.pr_str();
  if (typeof malValue === "function") return "#<function>";

  return malValue.toString();
};

class MalValue {
  constructor(value) {
    this.value = value;
  }

  pr_str() {
    return this.value.toString();
  }
}

class MalSymbol extends MalValue {
  constructor(value) {
    super(value);
  }
}

class MalKeyword extends MalValue {
  constructor(value) {
    super(value);
  }
}

class MalList extends MalValue {
  constructor(value) {
    super(value);
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

  pr_str() {
    return "[" + this.value.map(pr_str).join(" ") + "]";
  }
}

class MalNil extends MalValue {
  constructor(value) {
    super(null);
  }

  pr_str() {
    return "nil";
  }
}

module.exports = {
  MalSymbol,
  MalValue,
  MalList,
  MalVector,
  MalNil,
  MalKeyword,
  pr_str,
};
