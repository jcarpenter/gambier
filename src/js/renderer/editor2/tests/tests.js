import { syntaxTree, ensureSyntaxTree, EditorParseContext } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/rangeset'
import { EditorView, DecorationSet, ViewPlugin, ViewUpdate, MatchDecorator, Decoration } from '@codemirror/view'

/**
 * Use `ViewPlugin.fromClass` to append an element w/ doc length to upper-right of editor.
 * Per: https://codemirror.net/6/docs/migration#marked-text
 */
export const docSizePlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.dom = view.dom.appendChild(document.createElement("div"))
    this.dom.style.cssText =
      "position: absolute; inset-block-start: 2px; inset-inline-end: 5px"
    this.dom.textContent = view.state.doc.length
  }

  update(update) {
    if (update.docChanged) {
      this.dom.textContent = update.state.doc.length
    }
  }

  destroy() { this.dom.remove() }
})



/*
 Add mark decorations using `ViewPlugin.define` and `MatchDecorator`
 Per: https://discuss.codemirror.net/t/extend-overlay-mode/2818/3
 */

let mentionDeco = Decoration.mark({ class: "mention" })
let tagDeco = Decoration.mark({ class: "hashtag" })
let highlightDeco = Decoration.mark({ class: "highlight" })

let decorator = new MatchDecorator({
  regexp: /(@\w+)|(::.*?::)|(#\w+)/g,
  decoration: m => m[1] ? mentionDeco : m[2] ? highlightDeco : tagDeco
})

const highlightElements = ViewPlugin.define(view => ({
  decorations: decorator.createDeco(view),
  update(u) { this.decorations = decorator.updateDeco(u, this.decorations) }
}), {
  decorations: v => v.decorations
})





/**
 * 
 */
export function logTree(cm) {
  // const tree = syntaxTree(cm.state);
  const tree = ensureSyntaxTree(cm.state, 200);

  // console.log(cm.state.doc.line(3))
  // console.log(cm.state)
  // console.log(cm.state.languageDataAt('MarkdownParser', 1))
  // console.log(markdown().language.parseString(text))

  // console.log(cm.state.doc.line(3).text)
  // console.log(tree.children[3-1])
  // console.log(EditorParseContext.state)
  const cursor = tree.cursor(190)
  console.log("----") // "Get a syntax node at the cursor's current position."
  console.log(tree) // "Get doc syntax tree"
  // console.log(cm.state.doc) // "Get doc `length`, and array of text lines (`text`).
  console.log(cursor.node) // "Get a syntax node at the cursor's current position."
  console.log(cursor.node.from, cursor.node.to) // Get node from, to
  console.log(cm.state.sliceDoc(cursor.node.from, cursor.node.to)) // Get node text
  console.log(cursor.type) // Get node's type
  console.log(cursor.node.firstChild) // "The first child, if the node has children."
  cursor.firstChild()
  console.log(cursor.node) // "The first child, if the node has children."
  // console.log(cursor.tree) // "Get the tree that represents the current node, if any"
  // console.log(cursor)
  // console.log(tree.cursor(40))
}
