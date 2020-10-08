import { replaceMarkWithElement } from './editor-utils'
import Citation from "../component/Citation.svelte";

/**
 * Find and mark citations for the given line
 */
export default function markCitations(editor, lineHandle, citations) {
  
  if (citations.length > 0) {
    citations.forEach((c) => {
      
      const frag = document.createDocumentFragment();

      const text = c.text
      let keys = []

      // let key = c.children.find((c) => c.class.includes('key'))
      // key = key ? key.text : "Default"

      const component = new Citation({
        target: frag,
        props: {
          text: text,
          keys: keys
        }
      });

      replaceMarkWithElement(editor, frag, lineHandle.lineNo(), c.start, c.end)
    })
  }
}