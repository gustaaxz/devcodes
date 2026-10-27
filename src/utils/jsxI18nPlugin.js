function jsxTextElement(types, value) {
  const child = types.jsxElement(
    types.jsxOpeningElement(types.jsxIdentifier('__DevCodesText'), [
      types.jsxAttribute(types.jsxIdentifier('value'), types.stringLiteral(value))
    ], true),
    null,
    [],
    true
  )
  return types.jsxExpressionContainer(child)
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

function localizeBranch(types, expression) {
  if (types.isStringLiteral(expression)) {
    return types.jsxElement(
      types.jsxOpeningElement(types.jsxIdentifier('__DevCodesText'), [
        types.jsxAttribute(types.jsxIdentifier('value'), types.stringLiteral(expression.value))
      ], true),
      null,
      [],
      true
    )
  }
  if (types.isConditionalExpression(expression)) {
    expression.consequent = localizeBranch(types, expression.consequent)
    expression.alternate = localizeBranch(types, expression.alternate)
  }
  if (types.isLogicalExpression(expression) && expression.operator === '&&') {
    expression.right = localizeBranch(types, expression.right)
  }
  return expression
}

function localizeAttributeBranch(types, expression) {
  if (types.isStringLiteral(expression)) {
    return types.callExpression(types.identifier('__DevCodesAttributeText'), [types.stringLiteral(expression.value)])
  }
  if (types.isConditionalExpression(expression)) {
    expression.consequent = localizeAttributeBranch(types, expression.consequent)
    expression.alternate = localizeAttributeBranch(types, expression.alternate)
  }
  if (types.isLogicalExpression(expression) && expression.operator === '&&') {
    expression.right = localizeAttributeBranch(types, expression.right)
  }
  return expression
}

export function jsxI18nPlugin({ types }) {
  return {
    name: 'devcodes-jsx-i18n',
    visitor: {
      Program: {
        enter(path, state) { state.localized = false },
        exit(path, state) {
          if (!state.localized) return
          path.node.body.unshift(
            types.importDeclaration(
              [types.importSpecifier(types.identifier('__DevCodesText'), types.identifier('LocalizedText'))],
              types.stringLiteral('@devcodes/LocalizedText')
            ),
            types.importDeclaration(
              [types.importSpecifier(types.identifier('__DevCodesAttributeText'), types.identifier('translateActiveText'))],
              types.stringLiteral('@devcodes/i18n')
            )
          )
        }
      },
      JSXText(path, state) {
        const visibleText = normalizeJsxText(path.node.value)
        if (!visibleText.trim()) return
        state.localized = true
        path.replaceWith(jsxTextElement(types, visibleText))
      },
      JSXAttribute(path, state) {
        const name = path.node.name.name
        if (!['aria-label', 'aria-description', 'placeholder', 'title', 'alt', 'label', 'description', 'hint'].includes(name)) return
        if (types.isStringLiteral(path.node.value)) {
          state.localized = true
          path.node.value = types.jsxExpressionContainer(types.callExpression(
            types.identifier('__DevCodesAttributeText'),
            [types.stringLiteral(path.node.value.value)]
          ))
          return
        }
        if (!types.isJSXExpressionContainer(path.node.value)) return
        const expression = path.node.value.expression
        if (!types.isStringLiteral(expression) && !types.isConditionalExpression(expression) && !(types.isLogicalExpression(expression) && expression.operator === '&&')) return
        state.localized = true
        path.node.value.expression = localizeAttributeBranch(types, expression)
      },
      JSXExpressionContainer(path, state) {
        if (path.parentPath.isJSXAttribute()) return
        const expression = path.node.expression
        if (types.isStringLiteral(expression)) {
          state.localized = true
          path.node.expression = localizeBranch(types, expression)
          return
        }
        if (types.isConditionalExpression(expression) || (types.isLogicalExpression(expression) && expression.operator === '&&')) {
          const localized = localizeBranch(types, expression)
          if (localized !== expression) state.localized = true
        }
      }
    }
  }
}
