import type { Token, SExpr } from './types'

export function parse(tokens: Token[]): SExpr[] {
  let pos = 0

  function parseOne(): SExpr {
    if (pos >= tokens.length) throw new Error('Unexpected end of input')

    const token = tokens[pos]
    if (token.type !== 'lparen') throw new Error(`Expected '(' but got ${token.type}`)

    pos++

    if (pos >= tokens.length) throw new Error('Unexpected end of input after (')
    const nameToken = tokens[pos]
    if (nameToken.type !== 'symbol' && nameToken.type !== 'string') {
      throw new Error(`Expected name token but got ${nameToken.type}`)
    }
    const name = nameToken.value
    pos++

    const children: (SExpr | string | number)[] = []

    while (pos < tokens.length && tokens[pos].type !== 'rparen') {
      const t = tokens[pos]
      if (t.type === 'lparen') {
        children.push(parseOne())
      } else if (t.type === 'string') {
        children.push(t.value)
        pos++
      } else if (t.type === 'number') {
        children.push(t.value)
        pos++
      } else if (t.type === 'symbol') {
        children.push(t.value)
        pos++
      }
    }

    if (pos >= tokens.length) throw new Error('Unexpected end of input, expected )')
    pos++

    return { name, children }
  }

  const results: SExpr[] = []
  while (pos < tokens.length) {
    if (tokens[pos].type === 'lparen') {
      results.push(parseOne())
    } else {
      pos++
    }
  }
  return results
}
