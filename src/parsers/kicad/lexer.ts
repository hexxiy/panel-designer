import type { Token } from './types'

export function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    const ch = input[i]

    if (ch === ';') {
      while (i < input.length && input[i] !== '\n') i++
      continue
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen' })
      i++
      continue
    }

    if (ch === ')') {
      tokens.push({ type: 'rparen' })
      i++
      continue
    }

    if (ch === '"') {
      i++
      let value = ''
      while (i < input.length && input[i] !== '"') {
        value += input[i]
        i++
      }
      i++ // skip closing "
      tokens.push({ type: 'string', value })
      continue
    }

    if (/\s/.test(ch)) {
      i++
      continue
    }

    let value = ''
    while (i < input.length && !/\s/.test(input[i]) && input[i] !== '(' && input[i] !== ')' && input[i] !== '"') {
      value += input[i]
      i++
    }

    const num = Number(value)
    if (!isNaN(num) && value.trim().length > 0) {
      tokens.push({ type: 'number', value: num })
    } else if (value.length > 0) {
      tokens.push({ type: 'symbol', value })
    }
  }

  return tokens
}
