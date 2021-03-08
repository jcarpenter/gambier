import { getTextFromRange } from './editor-utils'

/**
 * Return an array of the inline elements on the line. First, parse `lineHandle.styles`, to create an array of the style objects on the line, and their start/stop points. Then pass this array to parsers for each element (citations, links, etc). These parsers create an object for each element, with it's details (e.g. string, start and end characters, url (in case of link)). We return an array of all the elements we find on the line.
 */
export function getInlineElementsForLine(cm, lineHandle) {

  const doc = cm.getDoc()
  const blockElements = cm.state.blockElements
  const lineNo = lineHandle.lineNo()


  // ---------- 0. Check if line has entities ---------- //

  // We'll return this at the end
  let inlineElements = []

  const blockStyles = lineHandle.styleClasses ? lineHandle.styleClasses.textClass : ''
  const lineHasBlockStyles = blockStyles !== ''
  const lineHasInlineStyles = lineHandle.styles && lineHandle.styles.some((s) => typeof s === 'string' && s !== '')

  const lineIsBlank = !lineHasInlineStyles

  // If line is blank or has no styles, return empty array
  if (lineIsBlank) return []


  // ---------- 1. Create array of styles ---------- //

  let styles = getLineStyles(doc, lineHandle)

  // If styles are empty, return empty array
  if (styles === []) return []


  // ---------- 2. Find entities ---------- //

  // Citations
  styles.forEach((s, index) => {
    const isStartOfCitation = s.classes.includes('citation-start')
    if (isStartOfCitation) {
      const endStyle = styles.slice(index + 1).find((s) => s.classes.includes('citation-end'))
      const line = s.line
      const start = s.start + s.text.length
      const end = endStyle.end - endStyle.text.length
      const string = getTextFromRange(doc, line, start, end)
      const element = { type: 'citation', line, start, end, string }
      inlineElements.push(element)
    }
  })

  // Code
  styles.forEach((s, index) => {
    const isStartOfCode = s.classes.includes('code-start')
    if (isStartOfCode) {
      const endStyle = styles.slice(index + 1).find((s) => s.classes.includes('code-end'))
      const line = s.line
      const start = s.start + s.text.length
      const end = endStyle.end - endStyle.text.length
      const string = getTextFromRange(doc, line, start, end)
      const element = { type: 'code', line, start, end, string }
      inlineElements.push(element)
    }
  })

  // Emphasis
  styles.forEach((s, index) => {
    const isStartOfEmphasis = s.classes.includes('em-start')
    if (isStartOfEmphasis) {
      const endStyle = styles.slice(index + 1).find((s) => s.classes.includes('em-end'))
      const line = s.line
      const start = s.start + s.text.length
      const end = endStyle.end - endStyle.text.length
      const string = getTextFromRange(doc, line, start, end)
      const element = { type: 'emphasis', line, start, end, string }
      inlineElements.push(element)
    }
  })

  // Fenced code blocks
  // styles.forEach((s) => {
  //   if (s.classes.includes('fenc')) {
  //     if (s.classes.includes('md') && s.text == '[') {
  //       newEntity = {
  //         start: s.start,
  //         end: 0,
  //         children: []
  //       }
  //       entities.citations.push(newEntity)
  //     } else if (s.classes.includes('md') && s.text == ']') {
  //       newEntity.end = s.end
  //     }
  //     newEntity.children.push(s)
  //     newEntity.text = getTextFromRange(doc, lineNo, newEntity.start, newEntity.end)
  //   }
  // })


  // Footnotes
  // styles.forEach((s) => {
  //   if (s.classes.includes('footnote') && s.classes.includes('inline')) {

  //     // Footnote: Inline

  //     if (s.text == '^[]' && s.classes.includes('malformed')) {
  //       element = {
  //         line: s.line,
  //         type: 'footnote-inline',
  //         string: '',
  //         start: s.start,
  //         end: s.end,
  //         children: [],
  //         error: 'empty',
  //       }
  //       inlineElements.push(element)
  //     } else {
  //       if (s.text == '^[') {
  //         element = {
  //           line: s.line,
  //           type: 'footnote-inline',
  //           string: '',
  //           start: s.start,
  //           end: 0,
  //           children: [],
  //           error: false,
  //         }
  //         inlineElements.push(element)
  //       } else if (s.classes.includes('content')) {
  //         element.content = {
  //           string: getTextFromRange(doc, lineNo, s.start, s.end),
  //           start: s.start,
  //           end: s.end
  //         }
  //       } else if (s.text == ']') {
  //         element.end = s.end
  //         element.string = getTextFromRange(doc, lineNo, element.start, element.end)
  //       }
  //     }
  //     element.children.push(s)

  //   } else if (s.classes.includes('footnote') && s.classes.includes('reference') && !s.classes.includes('anchor')) {

  //     // Footnote: Reference

  //     // If the footnote is at the start of a footnote reference definition line, we skip it. We determine this by the presence of the `anchor` style.

  //     if (s.text == '[^') {
  //       element = {
  //         line: s.line,
  //         type: 'footnote-reference',
  //         string: '',
  //         start: s.start,
  //         end: 0,
  //         children: [],
  //         error: false,
  //       }
  //       inlineElements.push(element)
  //     } else if (s.classes.includes('label')) {
  //       element.label = {
  //         string: getTextFromRange(doc, lineNo, s.start, s.end),
  //         start: s.start,
  //         end: s.end
  //       }

  //       // Get definition
  //       const definition = blockElements.find((e) => e.type.includes('footnote-reference-definition') && e.label.string == element.label.string
  //       )

  //       if (definition) {
  //         element.definition = {
  //           exists: true,
  //           line: definition.line,
  //           start: definition.content.start,
  //           end: definition.content.end,
  //           string: definition.content.string,
  //         }
  //       } else {
  //         element.error = 'missing-definition'
  //       }

  //     } else if (s.text == ']') {
  //       element.end = s.end
  //       element.string = getTextFromRange(doc, lineNo, element.start, element.end)
  //     }
  //     element.children.push(s)

  //   }
  // })

  // Header
  styles.forEach((s, index) => {
    const isStartOfCode = s.classes.includes('header-start')
    if (isStartOfCode) {
      const line = s.line
      const start = s.start + s.text.length
      const end = cm.doc.getLine(line).length
      const string = getTextFromRange(doc, line, start, end)
      const element = { type: 'header', line, start, end, string }
      inlineElements.push(element)
    }
  })

  // HR
  // Add support. Why isn't it flagged by 
  styles.forEach((s, index) => {
    const isHr = s.lineClasses.includes('hr')
    if (isHr) {
      const line = s.line
      const start = 0
      const end = cm.doc.getLine(line).length
      const element = { type: 'hr', line, start, end }
      inlineElements.push(element)
    }
  })


  // Links & Images

  for (const [index, s] of styles.entries()) {

    if (s.classes.includes('footnote-start')) {

      if (blockStyles.includes('footnote-reference-definition')) continue

      // Determine `type`
      const inlineOrRef = s.classes.includes('inline') ? 'inline' : 'reference'
      const type = `footnote-${inlineOrRef}`

      // Create element
      const endStyle = styles.slice(index + 1).find((s) => s.classes.includes('footnote-end'))
      if (!endStyle) return
      const line = s.line
      const start = s.start
      const end = endStyle.end
      const string = getTextFromRange(doc, line, start, end)
      const element = { type, line, start, end, string, children: [] }
      inlineElements.push(element)

      // Add `content` as child
      const contentStyle = styles.slice(index + 1).find((s) => s.classes.includes('content') && s.end <= element.end)
      if (contentStyle) {
        const line = contentStyle.line
        const start = contentStyle.start
        const end = contentStyle.end
        const string = getTextFromRange(doc, line, start, end)
        element.content = { string, line, start, end }
        element.children.push({ ...element.content })
      }

      // Add label (will be present if this is a reference footnote)
      const labelStyle = styles.slice(index + 1).find((s) => s.classes.includes('label') && s.end <= element.end)
      if (labelStyle) {
        const line = labelStyle.line
        const start = labelStyle.start
        const end = labelStyle.end
        const string = getTextFromRange(doc, line, start, end)
        element.label = { string, line, start, end }
        element.children.push({ ...element.label })

        // If it has a label, it's a reference link.
        // Get definition
        const definition = blockElements.find((e) => {
          return e.type?.includes('footnote-reference-definition') && e.label?.string == element.label.string
        })

        if (definition) {
          element.definitionLine = definition.line
          element.content = definition.content
        } else {
          element.error = 'missing-definition'
        }
      }

      continue
    }

    // Bare URL
    if (s.classes.includes('bare-url')) {
      const line = s.line
      const start = s.start
      const end = s.start + s.text.length
      const url = getTextFromRange(doc, line, start, end)
      const element = { type: 'link-bare-url', line, start, end, url }
      inlineElements.push(element)
      continue
    }

    // Link or Image
    if (s.classes.includes('link-start')) {

      // Determine `type`

      const imageOrLink = s.classes.includes('image') ? 'image' : 'link'
      const inlineOrRef = s.classes.includes('inline') ? 'inline' : 'reference'
      let refStyle = ''
      if (s.classes.includes('full')) {
        refStyle = '-full'
      } else if (s.classes.includes('collapsed')) {
        refStyle = '-collapsed'
      } else if (s.classes.includes('shortcut')) {
        refStyle = '-shortcut'
      }
      const type = `${imageOrLink}-${inlineOrRef}${refStyle}`

      // Create element

      const endStyle = styles.slice(index + 1).find((s) => s.classes.includes('link-end'))
      if (!endStyle) return
      const line = s.line
      const start = type.includes('image') ? s.start - 1 : s.start // Get the image's `!`.
      const end = endStyle.end
      const string = getTextFromRange(doc, line, start, end)
      const element = { type, line, start, end, string, children: [] }
      inlineElements.push(element)

      // Find children

      const textStyle = styles.slice(index + 1).find((s) => s.classes.includes('text') && s.end <= element.end)
      if (textStyle) {
        const line = textStyle.line
        const start = textStyle.start
        const end = textStyle.end
        const string = getTextFromRange(doc, line, start, end)
        element.text = { string, line, start, end }
        element.children.push({ ...element.text })
      }

      const urlStyle = styles.slice(index + 1).find((s) => s.classes.includes('url') && s.end <= element.end)
      if (urlStyle) {
        const line = urlStyle.line
        const start = urlStyle.start
        const end = urlStyle.end
        const string = getTextFromRange(doc, line, start, end)
        element.url = { string, line, start, end }
        element.children.push({ ...element.url })
      }

      const titleStyle = styles.slice(index + 1).find((s) => s.classes.includes('title') && s.end <= element.end)
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

        element.title = { string, line, start, end }
        element.children.push({ ...element.title })
      }

      const labelStyle = styles.slice(index + 1).find((s) => s.classes.includes('label') && s.end <= element.end)
      if (labelStyle) {
        const line = labelStyle.line
        const start = labelStyle.start
        const end = labelStyle.end
        const string = getTextFromRange(doc, line, start, end)
        element.label = { string, line, start, end }
        element.children.push({ ...element.label })

        // If it has a label, it's a reference link.
        // Get definition
        const definition = blockElements.find((e) => {
          return e.type?.includes('link-reference-definition') && e.label?.string == element.label.string
        })

        if (definition) {
          element.definitionLine = definition.line
          element.url = definition.url
          element.title = definition.title
        } else {
          element.error = 'missing-definition'
        }
      }

      continue
    }
  }

  // Links & Images
  // styles.forEach((s) => {

  //   if (s.classes.includes('image') || s.classes.includes('link')) {

  //     // if (!s.classes.includes('link') || blockStyles.includes('link-reference-definition')) return
  //     if (blockStyles.includes('link-reference-definition')) return

  //     // Create element when we find link opening character.
  //     // `!` for images, and `[` for non-images
  //     if ((s.classes.includes('image') && s.text == '!') || s.classes.includes('link') && s.text == '[') {

  //       element = {
  //         line: s.line,
  //         type: '',
  //         string: '',
  //         start: s.start,
  //         end: 0,
  //         children: [],
  //         error: false,
  //       }

  //       inlineElements.push(element)
  //     }

  //     if (s.classes.includes('text')) {

  //       // Text
  //       element.text = {
  //         string: getTextFromRange(doc, lineNo, s.start, s.end),
  //         start: s.start,
  //         end: s.end
  //       }
  //     } else if (s.classes.includes('url')) {

  //       // URL
  //       element.url = {
  //         string: getTextFromRange(doc, lineNo, s.start, s.end),
  //         start: s.start,
  //         end: s.end
  //       }
  //     } else if (s.classes.includes('title')) {

  //       // Title
  //       element.title = {
  //         string: getTextFromRange(doc, lineNo, s.start, s.end),
  //         start: s.start,
  //         end: s.end
  //       }
  //     } else if (s.classes.includes('label')) {

  //       // Label
  //       element.label = {
  //         string: getTextFromRange(doc, lineNo, s.start, s.end),
  //         start: s.start,
  //         end: s.end
  //       }

  //       // If it has a label, it's a reference link.
  //       // Get definition
  //       const definition = blockElements.find((e) => e.type?.includes('reference-definition') && e.label?.string == element.label.string
  //       )

  //       if (definition) {
  //         element.definitionLine = definition.line
  //         element.url = definition.url
  //         element.title = definition.title
  //       } else {
  //         element.error = 'missing-definition'
  //       }

  //     } else if (s.classes.includes('md') && (s.text.slice(-1) == ')' || s.text == ']' || s.text == '][]')) {

  //       // Close link, and flag errors

  //       element.end = s.end

  //       // Set type
  //       const imageOrLink = s.classes.includes('image') ? 'image' : 'link'
  //       const inlineOrRef = s.classes.includes('inline') ? 'inline' : 'reference'
  //       let refStyle = ''
  //       if (s.classes.includes('full')) {
  //         refStyle = '-full'
  //       } else if (s.classes.includes('collapsed')) {
  //         refStyle = '-collapsed'
  //       } else if (s.classes.includes('shortcut')) {
  //         refStyle = '-shortcut'
  //       }
  //       element.type = `${imageOrLink}-${inlineOrRef}${refStyle}`

  //       // Set string
  //       element.string = getTextFromRange(doc, lineNo, element.start, element.end)

  //       // Set text (if it wasn't set above). Only applies to inline and full reference links/images. 
  //       if (!element.text && refStyle !== '-collapsed' && refStyle !== '-shortcut') {
  //         // Text should be inserted right after the opening `[` character.
  //         const start = imageOrLink == 'image' ? element.start + 2 : element.start + 1
  //         element.text = { string: '', start: start, end: start }
  //       }

  //       // Set URL (if it wasn't set above). Only applies to inline links/images. Starts two characters after end of `text`.
  //       if (!element.url && element.type.includes('inline')) {
  //         const start = element.text.end + 2
  //         element.url = { string: '', start: start, end: start }
  //         element.error = 'missing-url'
  //       }

  //       // Set title (if it wasn't set above). Only applies to inline link/images. Starts right before ending `]` character.
  //       if (!element.title && element.type.includes('inline')) {
  //         element.title = { string: '', start: element.end - 1, end: element.end - 1 }
  //       }
  //     }

  //     element?.children.push(s)
  //   }
  // })

  // Strikethrough
  styles.forEach((s, index) => {
    const isStartOfStrikethrough = s.classes.includes('strikethrough-start')
    if (isStartOfStrikethrough) {
      const endStyle = styles.slice(index + 1).find((s) => s.classes.includes('strikethrough-end'))
      const line = s.line
      const start = s.start + s.text.length
      const end = endStyle.end - endStyle.text.length
      const string = getTextFromRange(doc, line, start, end)
      const element = { type: 'strikethrough', line, start, end, string }
      inlineElements.push(element)
    }
  })

  // Strong
  styles.forEach((s, index) => {
    const isStartOfStrong = s.classes.includes('strong-start')
    if (isStartOfStrong) {
      const endStyle = styles.slice(index + 1).find((s) => s.classes.includes('strong-end'))
      const line = s.line
      const start = s.start + s.text.length
      const end = endStyle.end - endStyle.text.length
      const string = getTextFromRange(doc, line, start, end)
      const element = { type: 'strong', line, start, end, string }
      inlineElements.push(element)
    }
  })

  // Task List
  styles.forEach((s) => {

    const isTaskOpen = s.lineClasses.includes('taskOpen') && s.classes.includes('md') && s.text == ('- [ ]')
    const isTaskClosed = s.lineClasses.includes('taskClosed') && s.classes.includes('md') && s.text == ('- [x]')

    if (isTaskOpen) {
      inlineElements.push({
        line: s.line,
        type: 'taskOpen',
        string: '',
        start: s.start,
        end: s.end,
        children: [],
        error: false,
      })
    } else if (isTaskClosed) {
      inlineElements.push({
        line: s.line,
        type: 'taskClosed',
        string: '',
        start: s.start,
        end: s.end,
        children: [],
        error: false,
      })
    }
  })

  // Sort entites by start value
  inlineElements.sort((a, b) => a.start - b.start)

  return inlineElements
}