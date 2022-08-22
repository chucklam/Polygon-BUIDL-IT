const fs = require('fs');
const { join } = require('path');
const ohm = require('ohm-js');

if (process.argv.length === 2) {
  console.error('Expected an arithmetic expression');
  process.exit(1);
}
const expression = process.argv[2];

const source = fs.readFileSync(join(__dirname, 'arithmetic.ohm'));
const arithmetic = ohm.grammar(source);

const memory = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

const semantics = arithmetic.createSemantics();

// Define an 'eval' operation to evaluate the given expression.
semantics.addOperation('eval', {
  // Exp(e) { return e.eval() }, // This "pass-through action" is implied.
  AddExp_plus:  (a, _, b) => a.eval() + b.eval(),
  AddExp_minus: (a, _, b) => a.eval() - b.eval(),
  MulExp_times: (a, _, b) => a.eval() * b.eval(),
  MulExp_div:   (a, _, b) => a.eval() / b.eval(),
  PriExp_paren: (_l, a, _r) => a.eval(),

  MemExp_memory: (_l, a, _r) => memory[a.eval()],

  number(_) { return parseInt(this.sourceString) },
});

const result = [
  semantics(arithmetic.match('12345')).eval() == 12345,
  semantics(arithmetic.match('1 + 2 - 3 + 4')).eval() == 4,
  semantics(arithmetic.match('4 / 2')).eval() == 2,
  semantics(arithmetic.match('100 + 1 * 2')).eval() == 102,
  semantics(arithmetic.match('(1 + 2) * 4')).eval() == 12,
  semantics(arithmetic.match('m[0] + 4 * m[2]')).eval() == 13,
];
// console.log(result);

// Define a 'masm' attribute to convert the given expression to Miden assembly code.
semantics.addAttribute('masm', {
  AddExp_plus:  (a, _, b) => [...a.masm, ...b.masm, 'u32checked_add'],
  AddExp_minus: (a, _, b) => [...a.masm, ...b.masm, 'u32checked_sub'],
  MulExp_times: (a, _, b) => [...a.masm, ...b.masm, 'u32checked_mul'],
  MulExp_div:   (a, _, b) => [...a.masm, ...b.masm, 'u32checked_div'],
  PriExp_paren: (_l, a, _r) => a.masm,

  // TODO
  // MemExp_memory: (_l, a, _r) => memory[a.eval()],

  number(_) { return [`push.${this.sourceString}`] },

  _nonterminal(...children) {
    if (children.length === 1) {
      return children[0].masm;
    } else {
      throw new Error("Missing semantic action for " + this.constructor);
    }
  }
});

const matchResult = arithmetic.match(expression);
const node = semantics(matchResult);

const code = [
  // Add opening setup
  'begin',
  '',
  ...node.masm,
  '',
  'end',
]
const masm = code.join('\n');

try {
  console.log(masm);
  const outfile = join(__dirname, 'main.masm');
  fs.writeFileSync(outfile, masm);
  console.log(`Executable Miden assembly code is written to ${outfile}`);
} catch (err) {
  console.error(err);
}