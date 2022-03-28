import { Pos } from "codemirror";
import { getFromAndTo, getModeAndState, writeMultipleEdits } from "../editor-utils";
import { getLineClasses } from "../map";

/**
 * Make selected lines plain text, if they are not already.
 * Removes header, quote and list (any type) line styles.
 * TODO: Support inline selections. If selection is single cursor
 * or encompasses entire line, remove line styles. Else, remove
 * styles from elements inside the inline text selection.
 * @param {*} cm 
 * @param {*} type 
 * @param {*} chars 
 */
export async function togglePlainText(cm, type, chars) {
  const ranges = cm.listSelections()
  let edits = []

  for (const r of ranges) {

    const { from, to, isMultiLine, isSingleCursor } = getFromAndTo(r)

    for (var i = from.line; i <= to.line; i++) {

      const { state, mode } = getModeAndState(cm, i)
      const lineHandle = cm.getLineHandle(i)
      const lineClasses = getLineClasses(lineHandle)
      
      if (mode.name !== 'markdown' || lineClasses.includes('frontmatter')) continue
      
      const isHeaderListOrQuote = lineClasses.includesAny('header', 'quote', 'list')
      if (!isHeaderListOrQuote) continue
      
      // // Remove block style characters from start of lnie
      // // https://regex101.com/r/YRtKTX/1
      // const { from, to, isMultiLine, isSingleCursor } = getFromAndTo(r, true)
      const lineText = cm.getLine(i)
      const text = lineText.replace(/^(^\s*\>\s)|(\#+\s*)|( *[*-]\s\[[x ]?\])|( *[-*] )|( *[\w]\. )/, '')
      const diffLength = lineText.length - text.length
      edits.push({ 
        text,
        from: Pos(i, 0), 
        to: Pos(i, lineText.length), 
        select: { 
          type: 'range', 
          from: Pos(from.line, from.ch - diffLength),
          to: Pos(to.line, to.ch - diffLength),
        } 
      })
    }
  }

  writeMultipleEdits(cm, edits)
}
