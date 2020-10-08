import { replaceMarkWithElement } from './editor-utils'
import ReferenceFootnote from "../component/ReferenceFootnote.svelte";

/**
 * Find and mark links for the given line
 */
export default function markReferenceFootnote(editor, lineHandle, footnotes) {
  
  if (footnotes.length > 0) {
    footnotes.forEach((f) => {

      let id = f.text
      let definition = ""

      // Find definition
      editor.eachLine((lineHandle) => {

        // Find lines with `footnote-reference-definition` line class.
        if (!lineHandle.styleClasses || !lineHandle.styleClasses.textClass.includes('footnote-reference-definition')) return
        
        // If the line text starts with the matching reference footnote id, then we've found our matching definition. Else, if we can't find a matching definition, use an error placeholder.
        if (lineHandle.text.substring(0, id.length) === id) {
          // Set `definition` to the rest of the line text, starting after the id. Plus 2 characters, so we skip the `: `.
          definition = lineHandle.text.substring(id.length + 2)
        } else {
          definition = "Definition not found."
        }
      })

      // Trim the `[^` and `]` characters from the start and end of the id.
      // Before: `[^wallace]`. After: wallace.
      id = id.substring(2, id.length - 1)

      const frag = document.createDocumentFragment();
      
      const component = new ReferenceFootnote({
        target: frag,
        props: {
          id: id,
          definition: definition,
        }
      });

      replaceMarkWithElement(editor, frag, lineHandle.lineNo(), f.start, f.end)
    })
  }
}