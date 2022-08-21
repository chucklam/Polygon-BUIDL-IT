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
      | ident
      | number

    ident (an identifier)
      = letter alnum*

    number (a number)
      = digit+
  }
`;
const arithmetic = ohm.grammar(source);

const constants = {pi: Math.PI, e: Math.E};

const semantics = arithmetic.createSemantics();
semantics.addOperation('eval', {
  // Exp(e) { return e.eval() }, // This "pass-through action" is implied.
  AddExp_plus(a, _, b) { return a.eval() + b.eval() },
  AddExp_minus(a, _, b) { return a.eval() - b.eval() },
  MulExp_times(a, _, b) { return a.eval() * b.eval() },
  MulExp_div(a, _, b) { return a.eval() / b.eval() },
  ExpExp_power(x, _, y)   { return Math.pow(x.eval(), y.eval()); },
  PriExp_paren(_l, a, _r) { return a.eval(); },

  ident(_l, _ns) {
    // Look up the value of a named constant, e.g., 'pi'.
    return constants[this.sourceString] || 0;
  },
  number(_) { return parseFloat(this.sourceString) },
});

const result = [
  semantics(arithmetic.match('100 + 1 * 2')).eval() == 102,
  semantics(arithmetic.match('1 + 2 - 3 + 4')).eval() == 4,
  semantics(arithmetic.match('1 + 2 ^ 3')).eval() == 9,
  semantics(arithmetic.match('(1 + 2) ^ 3')).eval() == 27,
  semantics(arithmetic.match('pi / pi')).eval() == 1,
  semantics(arithmetic.match('12345')).eval() == 12345,
];
console.log(result);
