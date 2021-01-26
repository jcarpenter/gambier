import { HighlightStyle, tags as t } from '@codemirror/highlight'

// The highlighting style for Gambier
export const highlightStyle = HighlightStyle.define(
  { tag: t.keyword, color: violet },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: coral },
  { tag: [t.processingInstruction, t.inserted], color: sage },
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

  // Quote
  {
    tag: t.quote,
    backgroundColor: "green"
  },
)