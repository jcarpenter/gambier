import { getTextFromRange, replaceMarkWithElement } from './editor-utils'
import Figure from '../component/Figure.svelte'

/**
 * Find and mark list items
 */
export default async function markList(editor, lineHandle, tokens) {

  const listMarker = lineHandle.text.trim().charAt(0)
  const line = lineHandle.lineNo()
  const start = 0
  const end = lineHandle.text.indexOf(listMarker) + 2

  const frag = document.createDocumentFragment()
  const span = document.createElement('span')
  span.setAttribute('data-marker', listMarker)
  span.classList.add('list-marker')
  frag.appendChild(span)

  editor.markText({ line: line, ch: start }, { line: line, ch: end }, {
    replacedWith: frag,
    clearOnEnter: false,
    selectLeft: false,
    selectRight: true,
    handleMouseEvents: false
  })
}