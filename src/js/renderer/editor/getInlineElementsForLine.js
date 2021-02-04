import { getTextFromRange } from './editor-utils'
import { getLineStyles } from './getLineStyles'

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

  let element

  // Citations
  styles.forEach((s) => {
    if (s.classes.includes('citation')) {
      if (s.classes.includes('md') && s.text == '[') {
        element = {
          line: s.line,
          type: 'citation',
          string: '',
          start: s.start,
          end: 0,
          children: []
        }
        inlineElements.push(element)
        // entities.citations.push(newEntity)
      } else if (s.classes.includes('md') && s.text == ']') {
        element.end = s.end
      }
      element.children.push(s)
      element.string = getTextFromRange(doc, lineNo, element.start, element.end)
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
  styles.forEach((s) => {
    if (s.classes.includes('footnote') && s.classes.includes('inline')) {

      // Footnote: Inline

      if (s.text == '^[]' && s.classes.includes('malformed')) {
        element = {
          line: s.line,
          type: 'footnote-inline',
          string: '',
          start: s.start,
          end: s.end,
          children: [],
          error: 'empty'
        }
        inlineElements.push(element)
      } else {
        if (s.text == '^[') {
          element = {
            line: s.line,
            type: 'footnote-inline',
            string: '',
            start: s.start,
            end: 0,
            children: [],
            error: false
          }
          inlineElements.push(element)
        } else if (s.classes.includes('content')) {
          element.content = {
            string: getTextFromRange(doc, lineNo, s.start, s.end),
            start: s.start,
            end: s.end
          }
        } else if (s.text == ']') {
          element.end = s.end
          element.string = getTextFromRange(doc, lineNo, element.start, element.end)
        }
      }
      element.children.push(s)

    } else if (s.classes.includes('footnote') && s.classes.includes('reference') && !s.classes.includes('anchor')) {

      // Footnote: Reference

      // If the footnote is at the start of a footnote reference definition line, we skip it. We determine this by the presence of the `anchor` style.

      if (s.text == '[^') {
        element = {
          line: s.line,
          type: 'footnote-reference',
          string: '',
          start: s.start,
          end: 0,
          children: [],
          error: false
        }
        inlineElements.push(element)
      } else if (s.classes.includes('label')) {
        element.label = {
          string: getTextFromRange(doc, lineNo, s.start, s.end),
          start: s.start,
          end: s.end
        }

        // Get definition
        const definition = blockElements.find((e) => e.type.includes('footnote-reference-definition') && e.label.string == element.label.string
        )

        if (definition) {
          element.definition = {
            exists: true,
            line: definition.line,
            start: definition.content.start,
            end: definition.content.end,
            string: definition.content.string,
          }
        } else {
          element.error = 'missing-definition'
        }

      } else if (s.text == ']') {
        element.end = s.end
        element.string = getTextFromRange(doc, lineNo, element.start, element.end)
      }
      element.children.push(s)

    }
  })

  // Links & Images
  styles.forEach((s) => {
    if (s.classes.includes('image') || s.classes.includes('link')) {

      // if (!s.classes.includes('link') || blockStyles.includes('link-reference-definition')) return
      if (blockStyles.includes('link-reference-definition')) return

      // Create element when we find link opening character.
      // `!` for images, and `[` for non-images
      if ((s.classes.includes('image') && s.text == '!') || s.classes.includes('link') && s.text == '[') {

        element = {
          line: s.line,
          type: '',
          string: '',
          start: s.start,
          end: 0,
          children: [],
          error: false
        }

        inlineElements.push(element)
      }

      if (s.classes.includes('text')) {

        // Text
        element.text = {
          string: getTextFromRange(doc, lineNo, s.start, s.end),
          start: s.start,
          end: s.end
        }
      } else if (s.classes.includes('url')) {

        // URL
        element.url = {
          string: getTextFromRange(doc, lineNo, s.start, s.end),
          start: s.start,
          end: s.end
        }
      } else if (s.classes.includes('title')) {

        // Title
        element.title = {
          string: getTextFromRange(doc, lineNo, s.start, s.end),
          start: s.start,
          end: s.end
        }
      } else if (s.classes.includes('label')) {

        // Label
        element.label = {
          string: getTextFromRange(doc, lineNo, s.start, s.end),
          start: s.start,
          end: s.end
        }

        // If it has a label, it's a reference link.
        // Get definition
        const definition = blockElements.find((e) => e.type?.includes('reference-definition') && e.label?.string == element.label.string
        )

        if (definition) {
          element.definitionLine = definition.line
          element.url = definition.url
          element.title = definition.title
        } else {
          element.error = 'missing-definition'
        }

      } else if (s.classes.includes('md') && (s.text.slice(-1) == ')' || s.text == ']' || s.text == '][]')) {

        // Close link, and flag errors

        element.end = s.end

        // Set type
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
        element.type = `${imageOrLink}-${inlineOrRef}${refStyle}`

        // Set string
        element.string = getTextFromRange(doc, lineNo, element.start, element.end)

        // Set text (if it wasn't set above). Only applies to inline and full reference links/images. 
        if (!element.text && refStyle !== '-collapsed' && refStyle !== '-shortcut') {
          // Text should be inserted right after the opening `[` character.
          const start = imageOrLink == 'image' ? element.start + 2 : element.start + 1
          element.text = { string: '', start: start, end: start }
        }

        // Set URL (if it wasn't set above). Only applies to inline links/images. Starts two characters after end of `text`.
        if (!element.url && element.type.includes('inline')) {
          const start = element.text.end + 2
          element.url = { string: '', start: start, end: start }
          element.error = 'missing-url'
        }

        // Set title (if it wasn't set above). Only applies to inline link/images. Starts right before ending `]` character.
        if (!element.title && element.type.includes('inline')) {
          element.title = { string: '', start: element.end - 1, end: element.end - 1 }
        }
      }
      
      element?.children.push(s)
    }
  })

  // Sort entites by start value
  inlineElements.sort((a, b) => a.start - b.start)

  return inlineElements
}