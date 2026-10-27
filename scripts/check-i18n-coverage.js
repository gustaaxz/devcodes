import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSync } from '@babel/core'
import { hasTranslation } from '../src/utils/i18n.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = path.join(root, 'src')

async function getJsxFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) return getJsxFiles(target)
    return entry.isFile() && entry.name.endsWith('.jsx') && !entry.name.endsWith('.test.jsx') ? [target] : []
  }))
  return nested.flat()
}

function normalizeJsxText(value) {
  const lines = value.replace(/\r/g, '').split('\n')
  let normalized = ''
  for (let index = 0; index < lines.length; index += 1) {
    let line = lines[index].replace(/\t/g, ' ')
    if (index !== 0) line = line.replace(/^\s+/, '')
    if (index !== lines.length - 1) line = line.replace(/\s+$/, '')
    if (!line) continue
    if (index > 0 && normalized) normalized += ' '
    normalized += line
  }
  return normalized
}

const literals = new Set()
function addVisibleBranch(expression) {
  if (expression.type === 'StringLiteral') literals.add(expression.value)
  if (expression.type === 'ConditionalExpression') {
    addVisibleBranch(expression.consequent)
    addVisibleBranch(expression.alternate)
  }
  if (expression.type === 'LogicalExpression' && expression.operator === '&&') addVisibleBranch(expression.right)
}
for (const file of await getJsxFiles(sourceRoot)) {
  const source = await readFile(file, 'utf8')
  const ast = parseSync(source, {
    filename: file,
    babelrc: false,
    configFile: false,
    parserOpts: { sourceType: 'module', plugins: ['jsx'] }
  })
  walk(ast)
}

function walk(node, parent = null) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    node.forEach((child) => walk(child, parent))
    return
  }
  if (node.type === 'JSXText') {
    const text = normalizeJsxText(node.value)
    if (text.trim()) literals.add(text)
  }
  if (node.type === 'JSXExpressionContainer' && ['JSXElement', 'JSXFragment'].includes(parent?.type)) {
    addVisibleBranch(node.expression)
  }
  if (node.type === 'JSXAttribute') {
    const name = node.name.name
    if (['aria-label', 'aria-description', 'placeholder', 'title', 'alt', 'label', 'description', 'hint'].includes(name) && node.value?.type === 'StringLiteral') {
      literals.add(node.value.value)
    }
    if (['aria-label', 'aria-description', 'placeholder', 'title', 'alt', 'label', 'description', 'hint'].includes(name) && node.value?.type === 'JSXExpressionContainer') {
      addVisibleBranch(node.value.expression)
    }
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc' || key === 'start' || key === 'end') continue
    if (value && typeof value === 'object') walk(value, node)
  }
}

const missing = [...literals]
  .filter((text) => /\p{L}/u.test(text))
  .filter((text) => !hasTranslation('en-US', text))
  .sort()
if (process.argv.includes('--list')) {
  process.stdout.write(`${JSON.stringify([...literals].sort(), null, 2)}\n`)
} else {
  process.stdout.write(`${missing.length} untranslated JSX strings out of ${literals.size}.\n`)
  if (missing.length) process.stdout.write(`${JSON.stringify(missing, null, 2)}\n`)
}
if (missing.length && !process.argv.includes('--list')) process.exitCode = 1
