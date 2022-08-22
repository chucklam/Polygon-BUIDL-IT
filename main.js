const ohm = require('ohm-js');

const source = String.raw`
  Arithmetic {
    Exp
      = AddExp

    AddExp
      = AddExp "+" MulExp  -- plus
      | AddExp "-" MulExp  -- minus
      | MulExp

    MulExp
      = MulExp "*" ExpExp  -- times
      | MulExp "/" ExpExp  -- div
      | ExpExp

    ExpExp
      = PriExp "^" ExpExp  -- power
      | PriExp

    PriExp
      = "(" Exp ")"  -- paren
      | MemExp

    MemExp
      = "m[" number "]"  -- memory
      | number

    number (a number)
      = digit+
  }
`;
const arithmetic = ohm.grammar(source);

const memory = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

const semantics = arithmetic.createSemantics();
semantics.addOperation('eval', {
  // Exp(e) { return e.eval() }, // This "pass-through action" is implied.
  AddExp_plus:  (a, _, b) => a.eval() + b.eval(),
  AddExp_minus: (a, _, b) => a.eval() - b.eval(),
  MulExp_times: (a, _, b) => a.eval() * b.eval(),
  MulExp_div:   (a, _, b) => a.eval() / b.eval(),
  ExpExp_power: (a, _, b) => Math.pow(a.eval(), b.eval()),
  PriExp_paren: (_l, a, _r) => a.eval(),

  MemExp_memory: (_l, a, _r) => memory[a.eval()],

  number(_) { return parseInt(this.sourceString) },
});

const result = [
  semantics(arithmetic.match('12345')).eval() == 12345,
  semantics(arithmetic.match('100 + 1 * 2')).eval() == 102,
  semantics(arithmetic.match('1 + 2 - 3 + 4')).eval() == 4,
  semantics(arithmetic.match('1 + 2 ^ 3')).eval() == 9,
  semantics(arithmetic.match('(1 + 2) ^ 3')).eval() == 27,
  semantics(arithmetic.match('m[0] + 4 * m[2]')).eval() == 13,
];
console.log(result);
