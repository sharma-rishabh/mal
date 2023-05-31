class Env {
  constructor(outer) {
    this.outer = outer;
    this.data = {};
  }

  set(symbol, malValue) {
    this.data[symbol.value] = malValue;
  }

  get(symbol) {
    const env = this.find(symbol);
    if (!env) throw `${symbol.value} not found`;
    return env.data[symbol.value];
  }

  find(symbol) {
    if (this.data[symbol.value] !== undefined) {
      return this;
    }

    if (this.outer) {
      return this.outer.find(symbol);
    }
  }
}

module.exports = { Env };
