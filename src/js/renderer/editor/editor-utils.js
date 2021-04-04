import { setMode } from "./editor2"
import { markDoc } from "./mark"
import * as map from './map'
import { blankLineRE } from "./regexp"

// -------- SPANS & ELEMENTS -------- //

export function getDocElements(cm) {
  const elements = []
  cm.eachLine((lineHandle) => {
    const lineElements = getLineElements(cm, lineHandle)
    elements.push(...lineElements)
  })
  return elements
}

/**
 * Return array of "spans" for the line.
 * Each also contains details about the parent "element" it 
 * belongs to (e.g. url spans might belong to link element).
 * Spans correspond with the spans in the rendered HTML output. 
 * NOTE: We parse these from `lineHandle.styles`, which is a  strangely-formatted (but very useful) array of classes (e.g. `link inline text`) and the token number they end on. The format is number-followed-by-string——e.g. `24, "link inline text", 35, "link inline url"`——where `24` is the ending character of `link inline text`, and the starting character of `link inline url`. This array can also contain empty strings (e.g. "") and multiple consecutive numbers, which we need to ignore when parsing (they seem to belong to empty tokens).
 */
export function getLineSpans(cm, lineHandle) {

  let spans = []

  // If lineHandle has no styles, return empty array
  if (!lineHandle.styles?.some((s) => typeof s === 'string' && s !== '')) return spans

  const line = lineHandle.lineNo()

  // Get line classes
  const lineClasses = getLineClasses(lineHandle)

  // ---------- Get spans from lineHandle "styles" ---------- //

  lineHandle.styles.forEach((s, index) => {

    // Check if style has anything we care about
    if (typeof s === 'string' && s !== '') {

      // Two numbers preceding a class string and seperated by null, are the class's `start` and `end` values. Given `4, null, 6, "md footnote reference"`, 4 = start and 6 = end of "md footnote reference". `end` = the most-immediately preceding number (not string) in the array, before the class (s). `start` = the second-most-immediately preceding number

      let start = null
      let end = 0
      let counter = index

      while (start == null) {
        counter--
        if (typeof lineHandle.styles[counter] == 'number') {
          if (end == 0) {
            end = lineHandle.styles[counter]
          } else {
            // Fix for very annoying `lineHandle.styles` quirk: If a style starts at the first character of a line (0), the sequence of numbers looks like: `N, 3, "inline footnote malformed md"`, where `N` is the number of times the document has been loaded (very weird). In that case, we just set the first number to zero.
            start = counter == 0 ? 0 : lineHandle.styles[counter]
            // start = (counter == 0 && (lineHandle.styles[counter] == 1 || lineHandle.styles[counter] == 2)) ? 0 : lineHandle.styles[counter]
          }
        }
      }

      // Create the style object
      const span = {
        string: getTextFromRange(cm, line, start, end),
        line,
        start,
        end,
        classes: s.split(' '),
        lineClasses,
      }

      // Is span markdown formatting?
      span.isFormatting = span.classes.includes('md')

      spans.push(span)
    }
  })


  // ---------- Get few more spans manually ---------- //

  // Some spans we need aren't present in the lineHandle styles 
  // (because they're not in the markdown). So we add them manually.
  // Or modify them, if necessary.

  // We iterate over a duplicate of the spans array, so we can mutate the original.
  spans.slice().forEach((s, index) => {

    // Capture the content of the header.
    // Everything after the "#" characters and subsequent whitespace.
    if (s.classes.includes('header-start')) {
      const start = s.start + s.string.length
      const end = cm.getLine(s.line).length
      var newSpan = {
        string: getTextFromRange(cm, s.line, start, end),
        line: s.line,
        start,
        end,
        classes: [],
        lineClasses: s.lineClasses,
      }
    }

    // If span is found, insert it after the current item
    if (newSpan) {
      spans.splice(index + 1, 0, newSpan)
    }
  })

  return spans
}

/** 
 * For the given line, return line classes. E.g. 'header'
*/
export function getLineClasses(lineHandle) {
  return lineHandle.styleClasses ?
    lineHandle.styleClasses.textClass :
    ""
}

/**
 * Get array of "elements" for the line. 
 * Elements are made of one or more spans.
 * E.g. `url` and `title` are child spans of a link element.
 * CodeMirror markdown mode returns spans, but does not understand
 * elements. So we map the elements by reading the spans.
 * @param {*} cm 
 * @param {*} lineHandle 
 */
export function getLineElements(cm, lineHandle) {

  let spans = getLineSpans(cm, lineHandle)
  let elements = []

  // If no spans, return empty array
  if (!spans) return

  for (const [index, s] of spans.entries()) {

    // We only care about 'start' spans. E.g. 'link-start'
    const isStartOfParentEl = s.classes.some((c) => c.includesAny('-start', 'bare-url', 'task'))

    if (!isStartOfParentEl) continue

    // ---------- Stub out the object ---------- //

    // We'll set `type` and end `below`
    let element = {
      type: '', // TBD
      line: s.line,
      start: s.start,
      classes: s.classes.filter((c) => !c.includes('-start') && c !== 'md'),
      end: 0, // TBD,
      isIncomplete: s.classes.includes('incomplete'),
      children: [],
      isNew: false
    }

    elements.push(element)

    // ---------- Set `type` and find `end` ---------- //

    if (s.classes.includes('bare-url')) {

      element.type = 'bare-url'
      element.end = s.end
      element.markdown = getTextFromRange(cm, element.line, element.start, element.end)
      element.mark = { isMarkable: false, isEditable: false }
      // Get content
      const start = element.start
      const end = element.end
      const string = element.markdown
      element.content = { start, end, string }

    } else if (s.classes.includes('citation-start')) {

      element.type = 'citation'
      element.end = spans.slice(index + 1).find((sp) => sp.classes.includes('citation-end')).end
      element.markdown = getTextFromRange(cm, element.line, element.start, element.end)
      element.mark = { isMarkable: true, isEditable: false }
      // Get content
      const start = element.start + 1
      const end = element.end - 1
      const string = getTextFromRange(cm, element.line, start, end)
      element.content = { start, end, string }

    } else if (s.classes.includes('email-in-brackets-start')) {

      element.type = 'email-in-brackets'
      element.end = spans.slice(index + 1).find((sp) => sp.classes.includes('email-in-brackets-end')).end
      element.markdown = getTextFromRange(cm, element.line, element.start, element.end)
      element.mark = { isMarkable: false, isEditable: false }
      // Get content
      const start = element.start + 1
      const end = element.end - 1
      const string = getTextFromRange(cm, element.line, start, end)
      element.content = { start, end, string }

    } else if (s.classes.includes('em')) {

      element.type = 'emphasis'
      element.end = spans.slice(index + 1).find((sp) => sp.classes.includes('em-end')).end
      element.markdown = getTextFromRange(cm, element.line, element.start, element.end)
      element.mark = { isMarkable: false, isEditable: false }
      // Get content
      const start = element.start + 1
      const end = element.end - 1
      const string = getTextFromRange(cm, element.line, start, end)
      element.content = { start, end, string }

    } else if (s.classes.includes('footnote-start')) {

      const isInline = s.classes.includes('inline')
      element.type = isInline ?
        'footnote-inline' :
        'footnote-reference'
      element.end = spans.slice(index + 1).find((sp) => sp.classes.includes('footnote-end')).end
      element.markdown = getTextFromRange(cm, element.line, element.start, element.end)
      element.mark = { isMarkable: true, isEditable: false }
      // Get content
      if (element.type == 'footnote-inline') {
        const start = element.start + element.markdown.indexOf('[') + 1
        const end = element.start + element.markdown.lastIndexOf(']')
        const string = getTextFromRange(cm, element.line, start, end)
        element.content = { start, end, string }
      }

    } else if (s.classes.hasAll('footnote', 'reference-definition-anchor-start')) {

      element.type = 'footnote-reference-definition'
      element.end = cm.getLine(element.line).length
      element.markdown = getTextFromRange(cm, element.line, element.start, element.end)
      element.mark = { isMarkable: false, isEditable: false }
      // Get content
      // TODO

    } else if (s.lineClasses.includes('header')) {

      element.type = 'header'
      element.markdown = cm.getLine(element.line)
      element.end = element.markdown.length
      element.mark = { isMarkable: false, isEditable: false }
      element.content = {
        start: element.start,
        end: element.end,
        string: element.markdown
      }

    } else if (s.classes.includes('link-start')) {

      const isImage = s.classes.includes('image')
      const isInline = s.classes.includes('inline')
      element.type = isInline ?
        isImage ? 'image-inline' : 'link-inline' :
        isImage ? 'image-reference' : 'link-reference'

      // If it's reference, determine what style
      if (element.type.includes('reference')) {
        if (s.classes.includes('full')) {
          element.type = element.type.concat('-full')
        } else if (s.classes.includes('collapsed')) {
          element.type = element.type.concat('-collapsed')
        } else if (s.classes.includes('shortcut')) {
          element.type = element.type.concat('-shortcut')
        }
      }

      element.end = spans.slice(index + 1).find((sp) => sp.classes.includes('link-end')).end

      if (isImage) {
        // For images, the preceding span is `!` character.
        // Decrement `start` by 1 so we capture it.
        element.start--
        // And set `parentEl` of it's span.
        spans[index - 1].element = element
      }

      element.markdown = getTextFromRange(cm, element.line, element.start, element.end)

      // Set mark details
      element.mark = { isMarkable: true, isEditable: isImage ? false : true }
      if (!isImage) {
        // Specify what span the mark should show
        if (element.type.includesAny('shortcut', 'collapsed')) {
          element.mark.displayedSpanName = 'label'
        } else {
          element.mark.displayedSpanName = 'text'
        }
      }

      // Get content
      element.content = {
        start: element.start,
        end: element.end,
        string: element.markdown
      }

    } else if (s.classes.hasAll('link', 'reference-definition-anchor-start')) {

      element.type = 'link-reference-definition'
      element.end = cm.getLine(element.line).length
      element.markdown = getTextFromRange(cm, element.line, element.start, element.end)
      element.mark = { isMarkable: false, isEditable: false }
      // Get content
      // TODO

    } else if (s.classes.includes('url-in-brackets-start')) {

      element.type = 'url-in-brackets'
      element.end = spans.slice(index + 1).find((sp) => sp.classes.includes('url-in-brackets-end')).end
      element.markdown = getTextFromRange(cm, element.line, element.start, element.end)
      element.mark = { isMarkable: false, isEditable: false }
      // Get content
      // TODO

    } else if (s.classes.includes('strong')) {

      element.type = 'strong'
      element.end = spans.slice(index + 1).find((sp) => sp.classes.includes('strong-end')).end
      element.markdown = getTextFromRange(cm, element.line, element.start, element.end)
      element.mark = { isMarkable: false, isEditable: false }
      // Get content
      const start = element.start + 2
      const end = element.end - 2
      const string = getTextFromRange(cm, element.line, start, end)
      element.content = { start, end, string }

    } else if (s.classes.includes('task')) {

      // Bit hacky:
      // Set start back 2 characters, to ensure that mark replacement
      // also replaces the preceding `- ` characters.
      // Before: `[x] ` After: `- [x] `
      element.isClosed = s.classes.includes('task-closed')
      element.start = s.start - 2
      element.type = 'task'
      element.end = s.end
      element.markdown = getTextFromRange(cm, element.line, element.start, element.end)
      element.mark = { isMarkable: false, isEditable: false }
      // Get content
      // TODO
    }


    // ---------- Get children ---------- //

    if (element.type == 'email-in-brackets') {

      // The email address is everything between the brackets
      const start = element.start + 1
      const end = element.end - 1
      const string = getTextFromRange(cm, element.line, start, end)
      element.url = { start, end, string }

    } else if (element.type == 'footnote-reference') {

      const label = spans.slice(index + 1).find((s) => s.classes.includes('label') && s.end <= element.end)
      if (label) {
        element.label = {
          start: label.start,
          end: label.end,
          string: getTextFromRange(cm, element.line, label.start, label.end)
        }
      }

    } else if (element.type == 'footnote-reference-definition') {

      const label = spans.slice(index + 1).find((s) => s.classes.includes('label') && s.end <= element.end)
      if (label) {
        element.label = {
          start: label.start,
          end: label.end,
          string: getTextFromRange(cm, element.line, label.start, label.end)
        }
      }

      // This is a weird one. We don't actually wrap the content in a span. So we get the content by capturing everything between the end of the anchor, and the end of the line.
      const endOfTheAnchor = spans.slice(index + 1).find((s) => s.classes.includes('reference-definition-anchor-end')).end
      const endOfTheLine = element.end
      element.content = {
        start: endOfTheAnchor,
        end: endOfTheLine,
        string: getTextFromRange(cm, element.line, endOfTheAnchor, endOfTheLine)
      }

    } else if (element.type.includesAny('link', 'image')) {

      // If the element is incomplete, with spans missing (e.g no URL entered)
      // we still create the property, with empty string, and correct start/end ch.

      const text = spans.slice(index + 1).find((s) => s.classes.includes('text') && s.end <= element.end)
      if (text) {
        element.text = {
          start: text.start,
          end: text.end,
          string: getTextFromRange(cm, element.line, text.start, text.end),
        }
      } else if (element.type.equalsAny('link-inline', 'image-inline')) {
        element.text = {
          start: element.start + element.markdown.indexOf('[') + 1,
          end: element.start + element.markdown.indexOf('[') + 1,
          string: '',
        }
      }
      element.children.push(text)

      const url = spans.slice(index + 1).find((s) => s.classes.includes('url') && s.end <= element.end)
      if (url) {
        element.url = {
          start: url.start,
          end: url.end,
          string: getTextFromRange(cm, element.line, url.start, url.end),
        }
      } else if (element.type.equalsAny('link-inline', 'image-inline')) {
        element.url = {
          start: element.start + element.markdown.indexOf('(') + 1,
          end: element.start + element.markdown.indexOf('(') + 1,
          string: ''
        }
      }
      element.children.push(url)

      const title = spans.slice(index + 1).find((s) => s.classes.includes('title') && s.end <= element.end)
      if (title) {
        // Get string w/o the preceding whitespace and wrapping characters: ", ', (
        // Before: ` "Computers"` After: `Computers`.
        // We always strip 1 or more from start (whitespace can vary), // and 1 from the end.
        // Spec: https://spec.commonmark.org/0.18/#link-title
        const wrappedString = getTextFromRange(cm, element.line, title.start, title.end)
        const openingCharactersLength = wrappedString.match(/\s+("|'|\()/)[0].length
        element.title = {
          start: title.start + openingCharactersLength,
          end: title.end - 1,
          string: wrappedString.slice(openingCharactersLength, wrappedString.length - 1)
        }
      } else if (element.type.equalsAny('link-inline', 'image-inline')) {
        element.title = {
          start: element.url.end,
          end: element.url.end,
          string: ''
        }
      }

      if (element.type.includesAny('link-reference', 'image-reference')) {

        const label = spans.slice(index + 1).find((s) => s.classes.includes('label') && s.end <= element.end)
        if (label) {
          element.label = {
            start: label.start,
            end: label.end,
            string: getTextFromRange(cm, element.line, label.start, label.end),
          }
        } else {
          // TODO: This needs to differ, based on full vs collapsed
          // element.label = {
          //   start: element.start + element.markdown.indexOf('[') + 1,
          //   end:  element.start + element.markdown.indexOf(']'),
          // }
        }
        element.children.push(element.label)
      }

      // if (label) {
      //   element.label = {
      //     start: label.start,
      //     end: label.end,
      //     string: getTextFromRange(cm, element.line, label.start, label.end)
      //   }
      // }


    } else if (element.type == 'url-in-brackets') {

      // The URL is everything between the brackets
      const urlStart = element.start + 1
      const urlEnd = spans.slice(index + 1).find((s) => s.classes.includes('url-in-brackets-end')).end - 1
      element.url = {
        start: urlStart,
        end: urlEnd,
        string: getTextFromRange(cm, element.line, urlStart, urlEnd)
      }
    }

    // ---------- If there's a marker, get it ---------- //

    // if (element.isMarked) {
    //   element.mark = cm.findMarksAt(
    //     { line: element.line, ch: element.start }
    //   )[0]
    // }

    // Add child spans to element
    element.spans = spans.slice(index).filter((s) => element.start <= s.start && s.end <= element.end)
  }






  // // Filter to non-formatting spans, with elements
  // spans = spans.filter((s) => s.element)

  // // Get elements from spans
  // let elements = spans.map((s) => s.element)

  // elements = elements.filter((e, index) => {
  //   const prevEl = elements[index - 1]
  //   const sameAsPrevEl = e.start == prevEl?.start
  //   return sameAsPrevEl ? false : true
  // })

  return elements
}


/**
 * Get span at specified line and ch
 * Exclude formatting.
 */
export function getSpanAt(cm, line, ch) {
  const lineSpans = getLineSpans(cm, cm.getLineHandle(line))
  const span = lineSpans.find((s) =>
    s.line == line &&
    s.start < ch &&
    ch < s.end &&
    !s.isFormatting
  )
  return span
}


/**
 * Get element at specified line and ch
 */
export function getElementAt(cm, line, ch) {
  const lineHandle = cm.getLineHandle(line)
  const lineElements = getLineElements(cm, lineHandle)
  const element = lineElements.find((e) =>
    e.line == line &&
    e.start < ch &&
    ch < e.end
  )
  return element
}


/**
 * Get the surrounding span, if the cursor is a single cursor
 * (there's no selected text), and is inside a selectable span.
 */
export function getSurroundingSpan(cm) {

  let span

  const activeSelections = cm.listSelections()
  const isSingleCursor =
    activeSelections.length == 1 &&
    activeSelections[0].anchor.line == activeSelections[0].head.line &&
    activeSelections[0].anchor.ch == activeSelections[0].head.ch

  if (isSingleCursor) {
    const cursor = activeSelections[0].anchor
    span = getSpanAt(cm, cursor.line, cursor.ch)
  }

  return span
}



// -------- GET DOCUMENT DETAILS -------- //

/**
 * Return a {state, mode} object with the inner mode and its 
 * state for the given line number.
 * @param {*} line - Integer. Line number. 
 */
export function getModeAndState(cm, line) {
  const eolState = cm.getStateAfter(line)
  return CodeMirror.innerMode(cm.getMode(), eolState)
}

/**
 * Sometimes we need to access CodeMirror instances from outside their parent Editor components. This is a convenience function for finding the CM instance from `windows.cmInstances` by the ID of it's associated panel, and getting it's ddata.
 * @param {*} panelId 
 */
export function getCmDataByPanelId(panelId) {
  const cmInstance = window.cmInstances.find((c) => c.panel.id == panelId)
  const data = cmInstance.getValue()
  return data
}

/**
 * For the given reference label, find the definition.
 * Returns object
 * @param {*} cm 
 * @param {*} label 
 * @param {*} type - 'link' or 'footnote' 
 */
export function getReferenceDefinitions(cm, label, type = 'link') {

  let definitionsMatchingLabel = []

  for (var i = 0; i < cm.lineCount(); i++) {
    const firstTokenType = cm.getTokenTypeAt({ line: i, ch: 0 })
    if (!firstTokenType) continue
    if (!firstTokenType.includes(`${type}-reference-definition-start`)) continue
    const element = map.getElementAt(cm, i, 1)
    const elementLabel = element.spans.find((s) => s.type.includes('label'))?.string
    if (elementLabel == label) {
      definitionsMatchingLabel.push(element)
    }
  }

  return definitionsMatchingLabel

  cm.eachLine((lineHandle) => {

    // If line has no block styles, return
    const lineHasBlockStyles =
      lineHandle.styleClasses !== undefined &&
      lineHandle.styleClasses !== null
    if (!lineHasBlockStyles) return

    // If blockStyles doesn't have reference definition, 
    // of the correct type, return.
    // lineHandles contain a list of block-level classes in the 
    // (confusingly-named) `stylesClasses.textClass` property.
    const blockStyles = lineHandle.styleClasses.textClass
    if (!blockStyles.includes(`${type}-reference-definition`)) return

    const definition = getLineSpans(cm, lineHandle).find((s) => s.element.label.string == label)?.element

    if (definition) {
      definitionsMatchingLabel.push(definition)
    }
  })

  return definitionsMatchingLabel
}


/**
 * Get title w/o the preceding whitespace and wrapping characters.
 * Before: ` "Computers"` After: `Computers`.
 * We always strip 1 or more characters from start, and 1 from end.
 * CommonMark spec: https://spec.commonmark.org/0.18/#link-title
 */
export function getTitleWithoutWrappingCharacters(line, start, end, string) {

  const openingCharactersLength = string.match(/\s+("|'|\()/)[0].length

  return {
    line,
    start: start + openingCharactersLength,
    end: end - 1,
    string: string.slice(openingCharactersLength, string.length - 1)
  }
}


/**
 * Is specified line a list?
 */
export function isList(cm, line) {
  const lineHandle = cm.getLineHandle(line)
  const lineIsList = getLineClasses(lineHandle).includes('list')
  return lineIsList
}


/**
 * For a given range, if there are multiple lines selected,
 * return true if the lines contain a heterogeneous mix of
 * line styles (e.g. header and ul).
 */
export function isLineClassesHeterogeneous(cm, range) {

  const { topLine, bottomLine } = getTopAndBottomLines(range)

  // If this is a single line selection, it cannot contain
  // multiple line styles, so we return false.
  if (topLine == bottomLine) return false

  const lineClassesInsideRange = []
  for (var i = topLine; i <= bottomLine; i++) {
    const lineHandle = cm.getLineHandle(i)
    const lineClasses = getLineClasses(lineHandle)
    if (lineClasses) {
      // lineClasses are formatted like `header h1` and `ol list-1`
      // The "main" style is always the first word.
      // That's the one we want.
      const mainLineClass = lineClasses.split(' ')[0]
      lineClassesInsideRange.push(mainLineClass)
    }
  }

  // We know line styles are heterogeneous if they don't all
  // match the first one.
  const areHeterogeneous =
    lineClassesInsideRange.length > 1 &&
    !lineClassesInsideRange.every((ls) => {
      return ls == lineClassesInsideRange[0]
    })

  return areHeterogeneous

}


/**
 * Get the top and bottom line values from a `range`
 * Determine which of `range.anchor` and `range.head` comes first
 * in the doc (is top), and which is bottom, and return their
 * line values.
 */
export function getTopAndBottomLines(range) {

  // First check if the range is just a single cursor
  // If yes, topLine and bottomLine are the same, so return
  const isSingleCursor =
    range.anchor.ch == range.head.ch &&
    range.anchor.line == range.head.line
  if (isSingleCursor) {
    const line = range.anchor.line
    return { topLine: line, bottomLine: line }
  }

  // Else, determine which is top and bottom lines
  const objA = range.anchor
  const objB = range.head
  const topLine = Math.min(objA.line, objB.line)
  let bottomLine = Math.max(objA.line, objB.line)

  // Check if bottom line selection ends on the first character.
  // This happens when we select the entire previous line.
  // CodeMirror adds the next line to the selection. But it doesn't
  // look selected to the user, and if it increments, it's confusing.
  // So we check for this condition, and if true, remove the last line.
  const bottomObj = [objA, objB].find(({ line }) => line == bottomLine)
  if (bottomObj.ch == 0) {
    bottomLine--
  }
  return { topLine, bottomLine }
}


/**
 * For the given range (containing `anchor` and `pos`) objects,
 * determine which comes first in the document, and return as 
 * `from` and `to` objects.
 */
export function getFromAndTo(range, trimEmptyToLine = false) {

  const objA = range.anchor
  const objB = range.head
  const linesAreSame = objA.line == objB.line

  if (linesAreSame) {
    // Selection is inside same line:
    // Compare the characters
    const earlierCh = Math.min(objA.ch, objB.ch)
    const laterCh = Math.max(objA.ch, objB.ch)
    var from = [objA, objB].find((o) => o.ch == earlierCh)
    var to = [objA, objB].find((o) => o.ch == laterCh)
  } else {
    // Selection is across multiple lines:
    // Compare the lines
    const earlierLine = Math.min(objA.line, objB.line)
    const laterLine = Math.max(objA.line, objB.line)
    var from = [objA, objB].find((o) => o.line == earlierLine)
    var to = [objA, objB].find((o) => o.line == laterLine)
  }
  
  if (from.line !== to.line && to.ch == 0 && trimEmptyToLine) {
    to.line--
  }

  const isMultiLine = from.line !== to.line

  return { from, to, isMultiLine }
}



// -------- READ/WRITE STRINGS FROM DOC -------- //

/**
 * Return true if there's only one cursor, and no text selected.
 */
export function isSingleCursor(cm) {
  const selections = cm.listSelections()
  const isSingleCursor =
    selections.length == 1 &&
    selections[0].anchor.line == selections[0].head.line &&
    selections[0].anchor.ch == selections[0].head.ch
  return isSingleCursor
}

/**
 * Return a single character at the specified position
 */
export function getCharAt(cm, line, ch = 0) {
  return cm.getRange(
    { line: line, ch: ch }, // from
    { line: line, ch: ch + 1 } // to
  )
}

/**
 * A _slighty_ more compact snippet for getting text from a range.
 */
export function getTextFromRange(cm, line, start, end) {
  return cm.getRange({ line: line, ch: start }, { line: line, ch: end })
}

/**
 * Return N characters immediately preceding the `fromPos` value.
 * @param {*} cm 
 * @param {*} numOfCharacters - How many characters before fromPos.ch to get
 * @param {*} fromPos - Pos (object with line and ch) to look before.
 */
export function getPrevChars(cm, numSkipBehind, numToGet, fromPos,) {
  const { line, ch } = fromPos
  return cm.getRange(
    { line, ch: ch - numSkipBehind - numToGet },
    { line, ch: ch - numSkipBehind }
  )
}

/**
 * Return N characters immediately following the `fromPos` value.
 * @param {*} cm 
 * @param {*} numToGet - How many characters after fromPos.ch to get
 * @param {*} fromPos - Pos (object with line and ch) to look before.
 */
export function getNextChars(cm, numSkipAhead, numToGet, fromPos) {
  const { line, ch } = fromPos
  return cm.getRange(
    { line, ch: ch + numSkipAhead },
    { line, ch: ch + numSkipAhead + numToGet }
  )
}

/**
 * Write input value to cm.
 */
export function writeToDoc(cm, value, line, start, end) {
  cm.replaceRange(
    value,
    { line, ch: start },
    { line, ch: end },
    '+input'
  )
}


// -------- SAVE, OPEN, CLOSE -------- //

/**
 * On change, update `unsavedChanges` value on the parent panel.
 * Avoid spamming by first checking if there's a mismatch
 * between current state value and `cm.doc.isClean()`.
 */
export function setUnsavedChanges(cm) {
  const docIsNowClean = cm.doc.isClean()
  const prevStateHadUnsavedChanges = cm.panel.unsavedChanges

  if (docIsNowClean && prevStateHadUnsavedChanges) {
    // Need to update panel state: The doc is now clean.
    window.api.send('dispatch', {
      type: 'SET_UNSAVED_CHANGES',
      panelIndex: cm.panel.index,
      value: false
    })
  } else if (!prevStateHadUnsavedChanges) {
    // Need to update panel state: The doc now has unsaved changes.
    window.api.send('dispatch', {
      type: 'SET_UNSAVED_CHANGES',
      panelIndex: cm.panel.index,
      value: true
    })
  }
}

/**
 * Load empty doc into editor, and clear history
 * @param {*} cm 
 */
export function loadEmptyDoc(cm) {
  if (!cm) return

  cm.swapDoc(CodeMirror.Doc('', 'gambier'))
  cm.focus()
}

/**
 * Load doc into the editor, and clear history
 * @param {*} doc - Instance of an object from `files.byId`
 */
export async function loadDoc(cm, doc) {

  if (!cm || !doc) return

  // Get the doc text
  const text = doc.path ?
    await window.api.invoke('getFileByPath', doc.path, 'utf8') : ''

  // Load the doc text into the editor, and clear history.
  // "Each editor is associated with an instance of CodeMirror.Doc, its document. A document represents the editor content, plus a selection, an undo history, and a mode. A document can only be associated with a single editor at a time. You can create new documents by calling the CodeMirror.Doc(text: string, mode: Object, firstLineNumber: ?number, lineSeparator: ?string) constructor" — https://codemirror.net/doc/manual.html#Doc
  cm.swapDoc(CodeMirror.Doc(text))
  setMode(cm)

  // Restore cursor position, if possible
  const cursorHistory = window.state.cursorPositionHistory[doc.id]
  if (cursorHistory) {
    cm.setCursor(cursorHistory)

    // Vertically center cursor inside scrollable area
    const heightOfEditor = cm.getScrollInfo().clientHeight
    cm.scrollIntoView(null, heightOfEditor / 2)
  }

  // Map, mark and focus the editor
  markDoc(cm)

  // setCursor(cm)
}

/**
 * Focus the editor. We wrap in a setTimeout or it doesn't work.
 * @param {*} cm 
 */
export function focusEditor(cm) {
  setTimeout(() => {
    cm.focus()
  }, 0)
}

/** 
 * Save cursor position, so we can restore it if the doc is-reopened during the same app session (cursor position histories are erased at the start of each new app session).
 */
export function saveCursorPosition(cm) {

  const docId = cm.panel.docId
  const cursorPos = cm.doc.getCursor()

  // Only save if the doc is not empty, 
  // and the cursor is not on the first line.
  const shouldSaveCursorPos = docId && cursorPos.line !== 0

  if (shouldSaveCursorPos) {
    window.api.send('dispatch', {
      type: 'SAVE_CURSOR_POSITION',
      docId,
      line: cursorPos.line,
      ch: cursorPos.ch
    })
  }
}




// -------- WIZARD -------- //

export function switchInlineReferenceType(cm, newType) {
  // Strings depend on whether we're dealing with link, image or footnote

  if (newType == 'reference') {
    cm.replaceRange(
      `[${target.text.string}][]`,
      { line: target.line, ch: target.start },
      { line: target.line, ch: target.end }
    )
  } else if (newType == 'inline') {
    const text =
      target.type == 'link-reference-full'
        ? target.text.string
        : target.label.string
    const url = target.definition.url.string
    const title = target.definition.title.string
    cm.replaceRange(
      `[${text}](${url}${title})`,
      { line: target.line, ch: target.start },
      { line: target.line, ch: target.end }
    )
  }
}

export function switchReferenceStyles(cm, value, start, end) {
  console.log(value)
}

export function jumpToLine(cm, line, ch = 0) {
  cm.setCursor(line, ch)
  cm.focus()
}



// -------- MISC -------- //

export function lineIsPlainText(cm, line) {
  const lineClasses = getLineClasses(cm.getLineHandle(line))
  return lineClasses == ''
}

/**
 * Return `from` and `to` positions of the primary selection.
 * If `trim...` params are `true`, we exclude from and/or to
 * lines if their `ch` starts at the end or start of the line, 
 * respectively. This catches an annoying edge case, where the
 * user selects lines by dragging from the lines above or below.
 * In CodeMirror it doesn't look like the initiating lines are
 * part of the selection, but they are, which can cause 
 * unexpected results. Trimming them solves the confusion.
 * @param {boolean} trimEmptyFromLine
 * @param {boolean} trimEmptyToLine
 */
export function getPrimarySelection(cm, trimEmptyFromLine = false, trimEmptyToLine = true) {

  const from = cm.getCursor('from')
  const to = cm.getCursor('to')
  let isMultiLine = from.line !== to.line

  if (isMultiLine && trimEmptyFromLine) {
    if (from.ch == cm.getLine(from.line).length) {
      from.line++
    }
  }

  if (isMultiLine && trimEmptyToLine) {
    if (to.ch == 0) {
      to.line--
    }
  }

  // Update multiline, in case we trimmed lines
  isMultiLine = from.line !== to.line

  return { from, to, isMultiLine }
}

/**
 * Return the `start` and `end` line numbers of the list
 * of the specified type, at the specified line (if one exists).
 * @param {*} line - Integer. Look up and down from this line.
 * @param {*} type - `ul` or `ol`
 */
export function getStartAndEndOfList(cm, line, type, stopAtBlankLines = true) {
  
  // Find start
  let start = undefined
  for (var i = line - 1; i >= 0; i--) {
    const lineIsListOfSelectedType = getModeAndState(cm, i).state.list == type
    const breakForBlank = stopAtBlankLines && blankLineRE.test(cm.getLine(i))
    if (lineIsListOfSelectedType && !breakForBlank) {
      start = i
    } else {
      break
    }
  }

  // Find end
  let end = undefined
  for (var i = line + 1; i <= cm.lastLine(); i++) {
    const lineIsListOfSelectedType = getModeAndState(cm, i).state.list == type
    const breakForBlank = stopAtBlankLines && blankLineRE.test(cm.getLine(i))
    if (lineIsListOfSelectedType && !breakForBlank) {
      end = i
    } else {
      break
    }
  }

  return { start, end }

}

/**
 * Traverse an ordered list and set the counter on each row.
 * @param {} line - First line in the list.
 */
export function orderOrderedList(cm, line, origin = '+input', indent = 1, startAtFirstLineOfParentList = false) {
  let stillInsideTree = true
  let counter = 1

  // If true, find and set `line` to start of overall list.
  // This ensures the entire list will be ordered
  // (not just a child branch)
  if (startAtFirstLineOfParentList) {
    const { start, end } = getStartAndEndOfList(cm, line, 'ol')
    line = start
  }

  // While we're still inside this tree, do the following...
  while (stillInsideTree) {

    const { state, mode } = getModeAndState(cm, line)
    const lineIsOl = state.list == 'ol'
    const lineIndent = state.listStack.length
    let lineText = cm.getLine(line)

    if (!lineIsOl || !lineText || lineIndent < indent) {

      // Exit once we're no longer inside the tree
      stillInsideTree = false

    } else if (lineIndent > indent) {

      // Child branch found. Order it, then skip the
      // lines that it processed.
      line = orderOrderedList(cm, line, origin, lineIndent)
      continue

    } else {

      // Increment the list item
      // Then update the `line` and `counter` variables
      const newLineText = lineText.replace(/(\s*?)(\d)(\.|\))(\s*)/, (match, p1, p2, p3, p4) => {
        return `${p1}${counter}${p3}${p4}`
      })
      if (newLineText !== lineText) {
        cm.replaceRange(newLineText, { line: line, ch: 0 }, { line: line, ch: lineText.length }, origin)
      }
      line++
      counter++

    }
  }

  return line
}


export async function getClipboardContents() {
  try {
    const text = await navigator.clipboard.readText()
    return text
  } catch (err) {
    console.error('Failed to read clipboard contents: ', err)
  }
}

