import { HighlightStyle, tags as t } from '@codemirror/highlight'
import { EditorView, keymap } from '@codemirror/view'


const chalky = "#e5c07b",
  coral = "#e06c75",
  cyan = "#56b6c2",
  invalid = "#ffffff",
  ivory = "#abb2bf",
  stone = "#5c6370",
  malibu = "#61afef",
  sage = "#98c379",
  whiskey = "#d19a66",
  violet = "#c678dd",
  darkBackground = "#21252b",
  highlightBackground = "#2c313a",
  background = "#282c34",
  selection = "#3E4451",
  cursor = "#528bff"

// const --clr-blue: rgb(13, 103, 220);
// --clr-blue-light: #b9d0ee;
// --clr-blue-lighter: rgb(232, 242, 255);
// --clr-gray-darker: hsl(0, 0%, 15%);
// --clr-gray-lighter: hsl(0, 0%, 85%);

export function theme() {
  return EditorView.theme({
    $$focused: { outline: "none" },
    $scroller: {
      fontFamily: "-apple-system, 'BlinkMacSystemFont', sans-serif",
    },
    $line: {
      margin: "0 auto",
      minWidth: "30em",
      maxWidth: "48em",
      padding: "0 3em"
    },
    $heading: {
      backgroundColor: "red"
    }
  })
}

// The highlighting style for Gambier
export const highlightStyle = HighlightStyle.define(
  { tag: t.keyword, color: violet },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: coral },
  { tag: t.inserted, color: sage },
  { tag: [t.function(t.variableName), t.labelName], color: malibu },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: whiskey },
  { tag: [t.definition(t.name), t.separator], color: ivory },
  { tag: [t.typeName, t.className, t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: chalky },
  { tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)], color: cyan },
  { tag: [t.meta, t.comment], color: stone },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.link, color: coral, textDecoration: "underline" },
  { tag: t.link, color: coral, textDecoration: "underline" },
  { tag: t.string, color: "red" },
  {
    tag: t.heading,
    fontWeight: "bold", color: coral
  },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: whiskey },
  { tag: t.invalid, color: invalid },

  // Processing instruction
  // Is applied to: "HeaderMark HardBreak QuoteMark ListMark LinkMark EmphasisMark CodeMark"
  { 
    tag: t.processingInstruction,
    backgroundColor: sage
  },

  // Processing instruction + Strong
  // Is applied to: "HeaderMark HardBreak QuoteMark ListMark LinkMark EmphasisMark CodeMark"
  { 
    tag: [t.processingInstruction, t.strong],
    backgroundColor: "red"
  },

  // Inline code
  {
    tag: t.monospace,
    backgroundColor: "pink"
  },

  // Quote
  {
    tag: t.quote,
    color: "rgb(13, 103, 220)",
    textIndent: "-0.85em",
    fontStyle: "italic",
    // paddingLeft: "1em"
  },
)