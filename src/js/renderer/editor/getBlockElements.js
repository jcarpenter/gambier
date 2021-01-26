import { getLineStyles } from './getLineStyles'
import { getTextFromRange } from './editor-utils'

/**
 * Get `id` (label) from reference definition
 * Demo: https://regex101.com/r/JC4C5p/1
 * @param {*} lineHandle 
 */
function getId(lineHandle) {
  return lineHandle.text.match(/^!?\[\^?(.*)\]:/m)[1]
}

/**
 * Return an array of the block elements in the doc. First, parse `lineHandle.styleClasses.textClass`
 */
export function getBlockElements(cm) {

  let blockElements = []

  let doc = cm.getDoc()

  cm.operation(() => {
    cm.eachLine((lineHandle) => {

      // If line has no block element, return
      const lineHasBlockStyles = lineHandle.styleClasses !== undefined
      if (!lineHasBlockStyles) {
        return
      }

      // Stub out element. This is what we populate below, then return.
      let el = {
        line: lineHandle.lineNo(),
      }

      // lineHandles contain a list of block-level classes in the (confusingly-named) `stylesClasses.textClass` property.
      const blockStyles = lineHandle.styleClasses.textClass

      // Parse styles
      if (blockStyles.includes('header')) {

        // Header
        el.type = 'header'
        el.level = blockStyles.match(/h\d/)[0].substring(1)

      } else if (blockStyles.includes('link-reference-definition')) {

        const lineStyles = getLineStyles(cm, lineHandle)

        // Link reference definition
        el.type = 'link-reference-definition'

        const labelClass = lineStyles.find((l) => l.classes.some((c) => c.includes('label')))

        el.label = {
          string: labelClass.text,
          start: labelClass.start,
          end: labelClass.end
        }

        const urlClass = lineStyles.find((l) => l.classes.some((c) => c.includes('url')))

        el.url = {
          string: urlClass.text,
          start: urlClass.start,
          end: urlClass.end
        }

        const titleClass = lineStyles.find((l) => l.classes.some((c) => c.includes('title')))

        el.title = {
          string: titleClass ? titleClass.text : '',
          start: titleClass ? titleClass.start : el.url.end + 1,
          end: titleClass ? titleClass.end : el.url.end + 1
        }
        // }

      } else if (blockStyles == 'footnote-reference-definition') {

        const lineStyles = getLineStyles(cm, lineHandle)

        // Footnote reference definition
        el.type = 'footnote-reference-definition'

        const labelClass = lineStyles.find((l) => l.classes.some((c) => c.includes('label')))

        el.label = {
          string: labelClass.text,
          start: labelClass.start,
          end: labelClass.end
        }

        const regex = lineHandle.text.match(/^(\[\^.*?\]:\s)(.*?)$/m)
        const footnoteContent = regex[2]
        const labelEnd = regex[1].length
        const footnoteEnd = lineHandle.text.length

        // Get text content of the block (everything after `[^id]: `)
        el.content = {
          string: footnoteContent,
          start: labelEnd,
          end: footnoteEnd
        }

        // Footnote reference definitions can span multiple lines: "Subsequent paragraphs are indented to show that they belong to the previous footnote." — https://pandoc.org/MANUAL.html#footnotes. So we check if the next line has style `footnote-reference-definition-continued`. If yes, we set `multiline: true` flag.

        const definitionSpansMultipleLines = () => {
          const nextLineHandle = doc.getLineHandle(el.line + 1)
          return nextLineHandle.styleClasses && nextLineHandle.styleClasses.textClass == 'footnote-reference-definition-continued' ? true : false
        }

        el.multiline = definitionSpansMultipleLines()

      } else if (blockStyles.includes('quote')) {

        // Block quote
        el.type = 'blockquote'

      }

      // Push the element (as long as it's not `footnote-reference-definition-continued`)
      if (blockStyles !== 'footnote-reference-definition-continued') {
        blockElements.push(el)
      }
    })
  })

  return blockElements
}