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
      = MulExp "*" number  -- times
      | MulExp "/" number  -- div
      | number

    number (a number)
      = digit+
  }
`;
const arithmetic = ohm.grammar(source);

const semantics = arithmetic.createSemantics();
semantics.addOperation('eval', {
  // Exp(e) { return e.eval() }, // This "pass-through action" is implied.
  AddExp_plus(a, _, b) { return a.eval() + b.eval() },
  AddExp_minus(a, _, b) { return a.eval() - b.eval() },
  MulExp_times(a, _, b) { return a.eval() * b.eval() },
  MulExp_div(a, _, b) { return a.eval() / b.eval() },
  number(_) { return parseInt(this.sourceString) },
});

const result = [
  semantics(arithmetic.match('100 + 1 * 2')).eval() == 102,
  semantics(arithmetic.match('1 + 2 - 3 + 4')).eval() == 4,
  semantics(arithmetic.match('12345')).eval() == 12345,
];
console.log(result);
