const { stdout, stdin } = require("process");

const READ = (str) => str;
const EVAL = (ast) => ast;
const PRINT = (exp) => exp;

const rep = (string) => PRINT(EVAL(READ(string)));

stdin.setEncoding("utf8");
stdout.write("user> ");

stdin.on("data", (chunk) => {
  stdout.write(rep(chunk));
  stdout.write("user> ");
});
