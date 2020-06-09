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
  // span.innerHTML = `${listMarker}`
  // span.classList.add('list-marker')
  // const marker = document.createElement('span')
  // span.appendChild(marker)
  frag.appendChild(span)

  editor.markText({ line: line, ch: start }, { line: line, ch: end }, {
    collapsed: true,
    // replacedWith: frag,
    // className: 'list-marker',
    clearOnEnter: false,
    selectLeft: false,
    selectRight: true,
    handleMouseEvents: false
  })
  

  // const caption = text.substring(2, text.lastIndexOf(']'))
  // let srcPath = text.substring(text.lastIndexOf('(') + 1, text.lastIndexOf('.') + 4)
  // srcPath = await window.api.invoke('pathJoin', filePath, srcPath);
  // let alt = text.substring(text.lastIndexOf('('), text.lastIndexOf(')'))
  // alt = alt.substring(alt.indexOf('"') + 1, alt.lastIndexOf('"'))

  // const frag = document.createDocumentFragment()

  // const component = new Figure({
  //   target: frag,
  //   props: {
  //     caption: caption,
  //     url: srcPath,
  //     alt: alt
  //   }
  // })

  // replaceMarkWithElement(editor, frag, line, start, end)
}