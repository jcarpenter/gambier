import InlineFootnote from "../component/InlineFootnote.svelte";

/**
 * Find and mark links for the given line
 */
export default function markInlineFootnote(editor, lineHandle, inlineFootnotes) {
  
  if (sourceMode) return

  const line = lineHandle.lineNo()

  if (inlineFootnotes.length > 0) {
    inlineFootnotes.forEach((f) => {
      
      // Hide
      l.children.forEach((c) => {

        if (c.classes.includes('md')) {
          cm.markText({ line: line, ch: c.start }, { line: line, ch: c.end }, {
            collapsed: true
          })
        }
      })
      

      // const frag = document.createDocumentFragment();
      
      // let text = f.children.find((c) => c.class.includes('text'))
      // text = text ? text.text : "Default"

      // let url = f.children.find((c) => c.class.includes('url'))
      // url = url ? urf.text : "Default"

      // let title = f.children.find((c) => c.class.includes('title'))
      // title = title ? title.text : "Default"

      // const component = new InlineFootnote({
      //   target: frag,
      //   props: {
      //     text: text,
      //     url: url,
      //     title: title
      //   }
      // });

      // editor.markText({ line: lineHandle.lineNo(), ch: f.start }, { line: lineHandle.lineNo(), ch: f.end }, {
      //   replacedWith: frag,
      //   clearOnEnter: false,
      //   inclusiveLeft: false,
      //   inclusiveRight: false,
      //   handleMouseEvents: false
      // })
    })
  }
}