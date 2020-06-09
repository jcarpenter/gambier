import { getTextFromRange, replaceMarkWithElement } from './editor-utils'
import Figure from '../component/Figure.svelte'

/**
 * Find and mark links for the given line
 */
export default async function markFigures(editor, lineHandle, tokens, filePath) {

  const text = lineHandle.text
  const line = lineHandle.lineNo()
  const start = 0
  const end = tokens[tokens.length - 1].end
  
  const caption = text.substring(2, text.lastIndexOf(']'))
  let srcPath = text.substring(text.lastIndexOf('(') + 1, text.lastIndexOf('.') + 4)
  srcPath = await window.api.invoke('pathJoin', filePath, srcPath);
  let alt = text.substring(text.lastIndexOf('('), text.lastIndexOf(')'))
  alt = alt.substring(alt.indexOf('"') + 1, alt.lastIndexOf('"'))

  const frag = document.createDocumentFragment()

  const component = new Figure({
    target: frag,
    props: {
      caption: caption,
      url: srcPath,
      alt: alt
    }
  })

  replaceMarkWithElement(editor, frag, line, start, end)
}