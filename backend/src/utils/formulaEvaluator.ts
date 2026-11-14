/** Minimal safe arithmetic expression evaluator for `TestParameter.formula`
 *  (e.g. "(PCV*10)/RBC") — a hand-rolled recursive-descent parser over
 *  +,-,*,/,(),numbers and identifiers, deliberately with no `eval`/`Function`
 *  so a formula can never execute arbitrary code. Returns `null` on a parse
 *  error or a missing/non-numeric identifier instead of throwing, since a
 *  formula referencing a parameter the user hasn't filled in yet is an
 *  expected, recoverable state (not a bug). */
export function evaluateFormula(formula: string, values: Record<string, number>): number | null {
  const tokens = tokenize(formula);
  if (!tokens) return null;

  let pos = 0;

  function peek(): string | undefined {
    return tokens![pos];
  }
  function next(): string | undefined {
    return tokens![pos++];
  }

  function parseExpression(): number | null {
    let left = parseTerm();
    if (left === null) return null;
    while (peek() === "+" || peek() === "-") {
      const op = next();
      const right = parseTerm();
      if (right === null) return null;
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number | null {
    let left = parseFactor();
    if (left === null) return null;
    while (peek() === "*" || peek() === "/") {
      const op = next();
      const right = parseFactor();
      if (right === null) return null;
      if (op === "/" && right === 0) return null;
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  function parseFactor(): number | null {
    if (peek() === "-") {
      next();
      const value = parseFactor();
      return value === null ? null : -value;
    }
    if (peek() === "(") {
      next();
      const value = parseExpression();
      if (peek() !== ")") return null;
      next();
      return value;
    }
    const token = next();
    if (token === undefined) return null;
    if (/^\d+(\.\d+)?$/.test(token)) return Number(token);
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) {
      const value = values[token];
      return typeof value === "number" && Number.isFinite(value) ? value : null;
    }
    return null;
  }

  const result = parseExpression();
  return pos === tokens.length && result !== null && Number.isFinite(result) ? result : null;
}

function tokenize(formula: string): string[] | null {
  const pattern = /\s*([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[+\-*/()])\s*/y;
  const tokens: string[] = [];
  let index = 0;
  while (index < formula.length) {
    pattern.lastIndex = index;
    const match = pattern.exec(formula);
    if (!match || match.index !== index) return null;
    tokens.push(match[1]);
    index += match[0].length;
  }
  return tokens;
}
