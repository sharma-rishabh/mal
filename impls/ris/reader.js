const { MalSymbol, MalList, MalVector, MalNil } = require("./types.js");

class Reader {
  constructor(tokens) {
    this.tokens = tokens;
    this.position = 0;
  }

  peek() {
    return this.tokens[this.position];
  }

  next() {
    const token = this.peek();
    this.position++;
    return token;
  }
}

const read_atom = (reader) => {
  const token = reader.next();

  if (token.match(/^-?[0-9]+$/)) {
    return parseInt(token);
  }

  if (token === "nil") return new MalNil();
  if (token === "true") return true;
  if (token === "false") return false;

  return new MalSymbol(token);
};

const read_seq = (reader, endingSymbol) => {
  reader.next();

  const ast = [];
  while (reader.peek() !== endingSymbol) {
    if (reader.peek() === undefined) {
      throw "unbalanced";
    }
    ast.push(read_form(reader));
  }
  reader.next();
  return ast;
};

const read_list = (reader) => {
  const ast = read_seq(reader, ")");
  return new MalList(ast);
};

const read_vector = (reader) => {
  const ast = read_seq(reader, "]");
  return new MalVector(ast);
};

const read_form = (reader) => {
  const token = reader.peek();

  switch (token) {
    case "(":
      return read_list(reader);
    case "[":
      return read_vector(reader);
    default:
      return read_atom(reader);
  }
};

const tokenize = (str) => {
  const re =
    /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)/g;
  return [...str.matchAll(re)].map((x) => x[1]).slice(0, -1);
};

const read_str = (str) => {
  tokens = tokenize(str);
  reader = new Reader(tokens);
  return read_form(reader);
};

module.exports = { read_str };
