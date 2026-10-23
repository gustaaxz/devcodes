import { useMemo } from 'react'
import { tokenizeCode } from '../../utils/prism.js'
import './CodeViewer.css'

function renderToken(token, key) {
  if (typeof token === 'string') return token
  const classes = ['token', token.type]
  if (token.alias) classes.push(...[].concat(token.alias))
  return (
    <span key={key} className={classes.join(' ')}>
      {renderContent(token.content, key)}
    </span>
  )
}

function renderContent(content, key) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) return content.map((token, index) => renderToken(token, `${key}-${index}`))
  return renderToken(content, key)
}

export default function CodeViewer({ code, language, highlight }) {
  const lineCount = useMemo(() => code.split('\n').length, [code])
  const nodes = useMemo(() => {
    if (!highlight) return code
    return tokenizeCode(code, language).map((token, index) => renderToken(token, `t-${index}`))
  }, [code, language, highlight])

  const numbers = useMemo(() => Array.from({ length: lineCount }, (_, index) => index + 1).join('\n'), [lineCount])

  return (
    <div className="code-viewer">
      <pre className="code-viewer__gutter" aria-hidden="true">
        {numbers}
      </pre>
      <pre className="code-viewer__code">
        <code>{nodes}</code>
      </pre>
    </div>
  )
}
