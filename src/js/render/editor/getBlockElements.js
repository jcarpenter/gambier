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

  let doc = cm.getDoc()

  // We'll return this at the end
  let blockElements = []

  cm.operation(() => {
    cm.eachLine((lineHandle) => {

      // If line has no block styles, return
      const lineHasBlockStyles = lineHandle.styleClasses !== undefined && lineHandle.styleClasses !== null
      if (!lineHasBlockStyles) return

      // lineHandles contain a list of block-level classes in the (confusingly-named) `stylesClasses.textClass` property.
      const blockStyles = lineHandle.styleClasses.textClass
      const styles = getLineStyles(cm, lineHandle)

      // Header
      if (blockStyles.includes('header')) {
        const element = {}
        element.type = 'header'
        element.line = lineHandle.lineNo()
        element.level = blockStyles.match(/h\d/)[0].substring(1)
        blockElements.push(element)
      }
      
      // Block quote
      if (blockStyles.includes('quote')) {
        const element = { type: 'blockquote' }
        blockElements.push(element)
      }
      
      // List
      // Applies to unordered, ordered, task lists.
      if (blockStyles.includes('ul')) {
        const element = { type: blockStyles }
        blockElements.push(element)
      }

      // Reference link definition
      if (blockStyles.includes('link-reference-definition')) {
        const element = {}
        element.type = 'link-reference-definition'
        
        const labelStyle = styles.find((s) => s.classes.some((c) => c.includes('label')))
        if (labelStyle) {
          element.label = {
            string: labelStyle.text,
            start: labelStyle.start,
            end: labelStyle.end
          }
        }

        const urlStyle = styles.find((s) => s.classes.some((c) => c.includes('url')))
        if (urlStyle) {
          element.url = {
            string: urlStyle.text,
            start: urlStyle.start,
            end: urlStyle.end
          }
        }

        const titleStyle = styles.find((s) => s.classes.some((c) => c.includes('title')))
        if (titleStyle) {

          // Get string w/o the preceding whitespace and wrapping characters: ", ', (
          // Before: ` "Computers"` After: `Computers`.
          // We always strip 1-or-more from start, and 1 from end.
          // CommonMark spec: https://spec.commonmark.org/0.18/#link-title
          const wrappedString = getTextFromRange(doc, titleStyle.line, titleStyle.start, titleStyle.end)
          const openingCharactersLength = wrappedString.match(/\s+("|'|\()/)[0].length

          const line = titleStyle.line
          const start = titleStyle.start + openingCharactersLength
          const end = titleStyle.end - 1
          const string = wrappedString.slice(openingCharactersLength, wrappedString.length - 1) 

          element.title = { line, start, end, string }
        }

        blockElements.push(element)
      } 


      // else if (blockStyles == 'footnote-reference-definition') {

      //   const lineStyles = getLineStyles(cm, lineHandle)

      //   // Footnote reference definition
      //   blockElement.type = 'footnote-reference-definition'

      //   const labelClass = lineStyles.find((l) => l.classes.some((c) => c.includes('label')))

      //   blockElement.label = {
      //     string: labelClass.text,
      //     start: labelClass.start,
      //     end: labelClass.end
      //   }

      //   const regex = lineHandle.text.match(/^(\[\^.*?\]:\s)(.*?)$/m)
      //   const footnoteContent = regex[2]
      //   const labelEnd = regex[1].length
      //   const footnoteEnd = lineHandle.text.length

      //   // Get text content of the block (everything after `[^id]: `)
      //   blockElement.content = {
      //     string: footnoteContent,
      //     start: labelEnd,
      //     end: footnoteEnd
      //   }

      //   // Footnote reference definitions can span multiple lines: "Subsequent paragraphs are indented to show that they belong to the previous footnote." — https://pandoc.org/MANUAL.html#footnotes. So we check if the next line has style `footnote-reference-definition-continued`. If yes, we set `multiline: true` flag.

      //   const definitionSpansMultipleLines = () => {
      //     const nextLineHandle = doc.getLineHandle(blockElement.line + 1)
      //     return nextLineHandle.styleClasses && nextLineHandle.styleClasses.textClass == 'footnote-reference-definition-continued' ? true : false
      //   }

      //   blockElement.multiline = definitionSpansMultipleLines()


      // }
      // // Push the element (as long as it's not `footnote-reference-definition-continued`)
      // if (blockStyles !== 'footnote-reference-definition-continued') {
      //   blockElements.push(blockElement)
      // }
    })
  })

  return blockElements
} 