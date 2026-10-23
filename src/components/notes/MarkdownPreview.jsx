import './MarkdownPreview.css'

function renderInline(text, keyPrefix) {
  const nodes = []
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let index = 0
  let match = pattern.exec(text)
  while (match !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const token = match[0]
    const key = `${keyPrefix}-${index}`
    if (token.startsWith('**')) nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    else nodes.push(<em key={key}>{token.slice(1, -1)}</em>)
    last = match.index + token.length
    index += 1
    match = pattern.exec(text)
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function parseBlocks(content) {
  const blocks = []
  let paragraph = []
  let list = null

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: 'p', text: paragraph.join(' ') })
      paragraph = []
    }
  }

  function flushList() {
    if (list) {
      blocks.push(list)
      list = null
    }
  }

  for (const line of content.split('\n')) {
    const heading = line.match(/^(#{1,3})\s+(.*)$/)
    const unordered = line.match(/^\s*[-*]\s+(.*)$/)
    const ordered = line.match(/^\s*\d+\.\s+(.*)$/)

    if (heading) {
      flushParagraph()
      flushList()
      blocks.push({ type: `h${heading[1].length}`, text: heading[2] })
    } else if (unordered || ordered) {
      flushParagraph()
      const type = ordered ? 'ol' : 'ul'
      if (!list || list.type !== type) {
        flushList()
        list = { type, items: [] }
      }
      list.items.push((ordered || unordered)[1])
    } else if (line.trim() === '') {
      flushParagraph()
      flushList()
    } else {
      flushList()
      paragraph.push(line.trim())
    }
  }
  flushParagraph()
  flushList()
  return blocks
}

export default function MarkdownPreview({ content }) {
  if (!content.trim()) return <p className="markdown__empty">Nada para visualizar.</p>

  const blocks = parseBlocks(content)

  return (
    <div className="markdown">
      {blocks.map((block, index) => {
        const key = `block-${index}`
        if (block.type === 'ul' || block.type === 'ol') {
          const ListTag = block.type
          return (
            <ListTag key={key}>
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`}>{renderInline(item, `${key}-${itemIndex}`)}</li>
              ))}
            </ListTag>
          )
        }
        const Tag = block.type
        return <Tag key={key}>{renderInline(block.text, key)}</Tag>
      })}
    </div>
  )
}
