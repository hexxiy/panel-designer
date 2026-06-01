export type SExprChild = string | number | SExprNode

export interface SExprNode {
  name: string
  children: SExprChild[]
}

function isComplexString(c: SExprChild): boolean {
  return typeof c === 'string' && c.startsWith('(')
}

function isComplex(c: SExprChild): boolean {
  return typeof c === 'object' || isComplexString(c)
}

export function sexpr(name: string, ...children: SExprChild[]): string {
  if (children.length === 0) return `(${name})`

  const allSimple = children.every(c => !isComplex(c))
  if (allSimple) {
    const inner = children.map(formatChild).join(' ')
    return `(${name} ${inner})`
  }

  const firstComplex = children.findIndex(c => isComplex(c))
  const leadingSimple = firstComplex > 0 ? children.slice(0, firstComplex) : []
  const rest = firstComplex >= 0 ? children.slice(firstComplex) : children

  const lines: string[] = []
  if (leadingSimple.length > 0) {
    lines.push(`(${name} ${leadingSimple.map(formatChild).join(' ')}`)
  } else {
    lines.push(`(${name}`)
  }

  for (const c of rest) {
    if (isComplex(c)) {
      const formatted = formatChild(c)
      for (const line of formatted.split('\n')) {
        lines.push(`  ${line}`)
      }
    } else {
      lines.push(`  ${formatChild(c)}`)
    }
  }
  lines.push(')')
  return lines.join('\n')
}

function formatChild(c: SExprChild): string {
  if (typeof c === 'number') return String(c)
  if (typeof c === 'object') return formatSExpr(c, 0)
  return c
}

function formatSExpr(node: SExprNode, depth: number): string {
  const indent = '  '.repeat(depth)
  const inner = node.children.map(c => {
    if (typeof c === 'number') return String(c)
    if (typeof c === 'string') return c
    return formatSExpr(c, depth + 1)
  }).join(' ')

  if (node.children.length === 0) return `${indent}(${node.name})`

  const allSimple = node.children.every(c => typeof c !== 'object')
  if (allSimple) return `${indent}(${node.name} ${inner})`

  const lines: string[] = [`${indent}(${node.name}`]
  for (const c of node.children) {
    if (typeof c === 'object') {
      const formatted = formatSExpr(c, depth + 1)
      for (const line of formatted.split('\n')) {
        lines.push(line)
      }
    } else {
      lines.push(`${indent}  ${formatChild(c)}`)
    }
  }
  lines.push(`${indent})`)
  return lines.join('\n')
}
