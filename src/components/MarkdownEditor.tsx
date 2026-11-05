import React, { useState, useRef } from 'react'
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Code,
  Minus,
  Eye,
  Edit3,
  Columns,
  HelpCircle,
  Check,
} from 'lucide-react'

interface MarkdownEditorProps {
  value: string
  onChange: (val: string) => void
  label?: string
  placeholder?: string
  rows?: number
}

// Lightweight, resilient Markdown renderer styled for Le Malaga brand
export function MarkdownRenderer({ content }: { content: string }) {
  if (!content || !content.trim()) {
    return (
      <div className="text-gray-400 italic text-sm py-4">
        (Empty content - type in the editor to see preview here)
      </div>
    )
  }

  // Parse inline elements (bold, italic, links, code)
  const parseInline = (text: string): React.ReactNode[] => {
    // Regex matches [link](url), **bold**, *italic*, `code`
    const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|\*.*?\*|`.*?`)/g
    const parts = text.split(regex)

    return parts.map((part, index) => {
      if (!part) return null

      // Link: [text](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/)
      if (linkMatch) {
        return (
          <a
            key={index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d95a2b] font-bold underline hover:text-[#b8461d] transition"
          >
            {linkMatch[1]}
          </a>
        )
      }

      // Bold: **text**
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={index} className="font-bold text-[#3e4a28]">
            {part.slice(2, -2)}
          </strong>
        )
      }

      // Italic: *text*
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={index} className="italic text-gray-800">
            {part.slice(1, -1)}
          </em>
        )
      }

      // Code: `code`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={index}
            className="bg-gray-100 text-[#d95a2b] px-1.5 py-0.5 rounded text-xs font-mono border border-gray-200"
          >
            {part.slice(1, -1)}
          </code>
        )
      }

      return <span key={index}>{part}</span>
    })
  }

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let isOrderedList = false

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      if (isOrderedList) {
        elements.push(
          <ol key={key} className="list-decimal pl-6 my-3 space-y-1 text-gray-700">
            {listItems}
          </ol>
        )
      } else {
        elements.push(
          <ul key={key} className="list-disc pl-6 my-3 space-y-1 text-gray-700">
            {listItems}
          </ul>
        )
      }
      listItems = []
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    // Bullet list: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (isOrderedList) flushList(`list-flush-${i}`)
      isOrderedList = false
      listItems.push(<li key={`item-${i}`}>{parseInline(trimmed.substring(2))}</li>)
      return
    }

    // Numbered list: 1. 2.
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (numMatch) {
      if (!isOrderedList && listItems.length > 0) flushList(`list-flush-${i}`)
      isOrderedList = true
      listItems.push(<li key={`item-${i}`}>{parseInline(numMatch[2])}</li>)
      return
    }

    // Not a list item, flush any existing list
    flushList(`list-end-${i}`)

    // Empty line
    if (!trimmed) {
      elements.push(<div key={`spacer-${i}`} className="h-2" />)
      return
    }

    // Horizontal rule: --- or ***
    if (trimmed === '---' || trimmed === '***') {
      elements.push(<hr key={`hr-${i}`} className="my-4 border-[#3e4a28]/20" />)
      return
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-lg md:text-xl font-heading uppercase font-bold text-[#3e4a28] mt-4 mb-2 tracking-wide"
        >
          {parseInline(trimmed.substring(4))}
        </h3>
      )
      return
    }
    if (trimmed.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-xl md:text-2xl font-heading uppercase font-extrabold text-[#3e4a28] mt-6 mb-2 tracking-wide"
        >
          {parseInline(trimmed.substring(3))}
        </h2>
      )
      return
    }
    if (trimmed.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-2xl md:text-3xl font-heading uppercase font-black text-[#3e4a28] mt-6 mb-3 tracking-wide"
        >
          {parseInline(trimmed.substring(2))}
        </h1>
      )
      return
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-4 border-[#d95a2b] pl-4 py-2 my-3 bg-[#fcfaf4] rounded-r text-gray-700 italic font-serif"
        >
          {parseInline(trimmed.substring(2))}
        </blockquote>
      )
      return
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="text-gray-700 text-sm md:text-base leading-relaxed my-2">
        {parseInline(trimmed)}
      </p>
    )
  })

  // Flush any trailing list
  flushList('trailing-list')

  return <div className="space-y-1">{elements}</div>
}

export function MarkdownEditor({
  value,
  onChange,
  label,
  placeholder = 'Write in Markdown or use toolbar to format...',
  rows = 10,
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<'write' | 'preview' | 'split'>('split')
  const [showCheatSheet, setShowCheatSheet] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Insert formatting at selection
  const insertFormat = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const el = textareaRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd
    const current = value || ''
    const selected = current.substring(start, end)
    const textToInsert = selected || defaultText

    const replacement = `${prefix}${textToInsert}${suffix}`
    const nextValue = current.substring(0, start) + replacement + current.substring(end)
    onChange(nextValue)

    // Restore focus and highlight
    setTimeout(() => {
      el.focus()
      const newCursorPos = start + prefix.length + textToInsert.length
      el.setSelectionRange(
        selected ? start + prefix.length : newCursorPos,
        selected ? start + prefix.length + textToInsert.length : newCursorPos
      )
    }, 10)
  }

  // Insert block at current line
  const insertLinePrefix = (prefix: string) => {
    const el = textareaRef.current
    if (!el) return

    const start = el.selectionStart
    const current = value || ''
    const lastNewline = current.lastIndexOf('\n', start - 1)
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1

    const nextValue = current.substring(0, lineStart) + prefix + current.substring(lineStart)
    onChange(nextValue)

    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 10)
  }

  const wordCount = value ? value.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = value ? value.length : 0

  return (
    <div className="border border-[#3e4a28]/25 rounded-xl bg-white overflow-hidden shadow-sm flex flex-col">
      {/* Editor Header & Toolbar */}
      <div className="bg-[#faf9f4] border-b border-[#3e4a28]/15 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {label && (
            <span className="text-xs font-bold uppercase tracking-wider text-[#3e4a28] mr-2">
              {label}
            </span>
          )}

          {/* Formatting buttons */}
          <div className="flex items-center gap-0.5 bg-white border border-[#3e4a28]/20 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => insertFormat('**', '**', 'Bold text')}
              title="Bold (**text**)"
              className="p-1.5 hover:bg-[#3e4a28]/10 rounded text-[#3e4a28] transition"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormat('*', '*', 'Italic text')}
              title="Italic (*text*)"
              className="p-1.5 hover:bg-[#3e4a28]/10 rounded text-[#3e4a28] transition"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix('## ')}
              title="Section Heading 2 (## Title)"
              className="p-1.5 hover:bg-[#3e4a28]/10 rounded text-[#3e4a28] transition font-bold text-xs"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix('### ')}
              title="Subheading 3 (### Subtitle)"
              className="p-1.5 hover:bg-[#3e4a28]/10 rounded text-[#3e4a28] transition font-bold text-xs"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-0.5 bg-white border border-[#3e4a28]/20 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => insertLinePrefix('- ')}
              title="Bullet List (- item)"
              className="p-1.5 hover:bg-[#3e4a28]/10 rounded text-[#3e4a28] transition"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix('1. ')}
              title="Numbered List (1. item)"
              className="p-1.5 hover:bg-[#3e4a28]/10 rounded text-[#3e4a28] transition"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix('> ')}
              title="Quote Block (> quote)"
              className="p-1.5 hover:bg-[#3e4a28]/10 rounded text-[#3e4a28] transition"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormat('[', '](https://example.com)', 'Link label')}
              title="Link ([text](url))"
              className="p-1.5 hover:bg-[#3e4a28]/10 rounded text-[#3e4a28] transition"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertFormat('`', '`', 'code')}
              title="Inline Code (`code`)"
              className="p-1.5 hover:bg-[#3e4a28]/10 rounded text-[#3e4a28] transition"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertLinePrefix('\n---\n')}
              title="Divider Line (---)"
              className="p-1.5 hover:bg-[#3e4a28]/10 rounded text-[#3e4a28] transition"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View mode switcher + cheat sheet toggle */}
        <div className="flex items-center gap-1.5">
          <div className="flex bg-[#3e4a28]/10 p-0.5 rounded-lg text-xs font-bold text-[#3e4a28]">
            <button
              type="button"
              onClick={() => setViewMode('write')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'write' ? 'bg-white shadow text-[#d95a2b]' : 'hover:bg-white/50'
              }`}
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'preview' ? 'bg-white shadow text-[#d95a2b]' : 'hover:bg-white/50'
              }`}
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                viewMode === 'split' ? 'bg-white shadow text-[#d95a2b]' : 'hover:bg-white/50'
              }`}
            >
              <Columns className="w-3 h-3" /> Split
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCheatSheet(!showCheatSheet)}
            title="Markdown syntax cheat sheet"
            className="p-1.5 hover:bg-[#3e4a28]/10 rounded text-[#3e4a28] transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Syntax Cheat Sheet Popup */}
      {showCheatSheet && (
        <div className="bg-[#fcfaf4] border-b border-[#3e4a28]/15 p-3 text-xs text-[#3e4a28] grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <span className="font-bold">## Section:</span> <code>## Title</code>
          </div>
          <div>
            <span className="font-bold">### Subtitle:</span> <code>### Subhead</code>
          </div>
          <div>
            <span className="font-bold">**Bold**:</span> <code>**text**</code>
          </div>
          <div>
            <span className="font-bold">*Italic*:</span> <code>*text*</code>
          </div>
          <div>
            <span className="font-bold">Bullet:</span> <code>- item</code>
          </div>
          <div>
            <span className="font-bold">Numbered:</span> <code>1. item</code>
          </div>
          <div>
            <span className="font-bold">Link:</span> <code>[Title](https://...)</code>
          </div>
          <div>
            <span className="font-bold">Quote:</span> <code>&gt; Wisdom quote</code>
          </div>
        </div>
      )}

      {/* Editor & Preview Area */}
      <div className="flex-1 grid grid-cols-1 divide-y sm:divide-y-0 sm:divide-x divide-[#3e4a28]/15 min-h-[220px]">
        {/* Write Pane */}
        {(viewMode === 'write' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'sm:col-span-1' : 'col-span-1'} p-3 flex flex-col`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#3e4a28]/60 mb-1 flex items-center justify-between">
              <span>Markdown Source</span>
              <span>{charCount} chars · {wordCount} words</span>
            </div>
            <textarea
              ref={textareaRef}
              rows={rows}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full flex-1 border-0 focus:ring-0 p-1 font-mono text-sm text-gray-800 placeholder-gray-400 resize-y leading-relaxed outline-none"
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`${
              viewMode === 'split' ? 'sm:col-span-1' : 'col-span-1'
            } p-4 bg-[#fcfaf4] overflow-y-auto max-h-[500px] flex flex-col`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#d95a2b] mb-2 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Live Formatted Preview
            </div>
            <div className="flex-1">
              <MarkdownRenderer content={value} />
            </div>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="bg-[#faf9f4] border-t border-[#3e4a28]/10 px-3 py-1.5 flex items-center justify-between text-[11px] text-[#3e4a28]/70">
        <span className="flex items-center gap-1">
          <Check className="w-3 h-3 text-green-600" /> Real-time instant preview enabled
        </span>
        <span className="text-[10px] italic">Uses standard Markdown & Pasifika typography</span>
      </div>
    </div>
  )
}
