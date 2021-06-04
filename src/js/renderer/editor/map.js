import { Pos } from "codemirror"
import { findLastIndex } from "../../shared/utils"


export const markableElements = [
  'citation',
  'figure',
  'footnote-inline',
  'footnote-reference',
  'image-inline',
  'image-reference-collapsed',
  'image-reference-full',
  'link-inline',
  'link-reference-collapsed',
  'link-reference-full',
  'task'
]

/**
 * Return string containing the line classes for the given line.
 * Returns "header h1", "ul list-2", etc.
 * Or blank string if the line does not have classes.
 */
export function getLineClasses(lineHandle) {
  return lineHandle.styleClasses ? lineHandle.styleClasses.textClass : ''
}

/**
 * Return array of all the elements in the doc.
  * @param {string} type - Optional. Only return elements of this type. E.g. "figure". 
 */
export function getDocElements(cm, type = undefined) {

  let elements = []

  // Get elements line by line
  for (var i = 0; i < cm.lineCount(); i++) {
    const lineElements = getLineElements(cm, i, type)
    if (lineElements.length) elements.push(...lineElements)
  }

  return elements
}

export function getSpansAt(cm, line, ch) {

  let spans = []
  const elements = getElementsAt(cm, line, ch)
  elements.forEach((e) => {
    const matches = e.spans.filter((s) => ch >= s.start && ch <= s.end)
    spans.push(...matches)
  })
  return spans
}

/**
 * Get first element found at specified line and ch
 * @param {string} type - Optional. Only return element of this type. E.g. "strong". 
 * @param {boolean} inclusive - Optional. If true, ch values that match e.start or e.end will be valid. Else, if false (default), ch values must fall _inside_ e.start and e.end.
 */
export function getElementAt(cm, line, ch, type = undefined, inclusive = false) {
  const lineElements = getLineElements(cm, line, type)
  return lineElements.find((e) =>
    e.line == line &&
    (inclusive ? e.start <= ch : e.start < ch) &&
    (inclusive ? e.end >= ch : e.end > ch)
  )
}

/**
 * Same as above, but return an array of all elements found.
 * Useful when we want to check for nested elements.
 * As in case of footnotes containing other elements.
 * @param {string} type - Optonal. Only return elements of this type. E.g. "strong". 
 */
export function getElementsAt(cm, line, ch, type = undefined) {

  let elements = getLineElements(cm, line, type).filter((e) =>
    e.line == line &&
    e.start < ch &&
    e.end > ch &&
    (e.type == type || type == undefined)
  )

  return elements
}

/**
 * Return elements inside the range.
 * @param {boolean} matchExactly - If true, looks for element matching
 * exact from/to positions, and returns that element (instead of array).
 */
export function getElementsInsideRange(cm, from, to, matchExactly = false) {
  if (matchExactly) {
    return getLineElements(cm, from.line).find((e) =>
      e.line == from.line &&
      e.line == to.line &&
      e.start == from.ch &&
      e.end == to.ch
    )
  } else {
    return getLineElements(cm, from.line).filter((e) =>
      e.line == from.line &&
      e.start >= from.ch &&
      e.end <= to.ch
    )
  }
}

/**
 * Return styled element (strong, emphasis, code, etc)
 * that matches range `from` and `to` exactly. Ignoring
 * wrapping markdown formatting characters. E.g:
 * Hello **world**.
 *         |---|
 */
export function getStyledElementAtRange(cm, from, to, type = undefined) {

  let element = getLineElements(cm, from.line).find((e) =>
    e.line == from.line &&
    e.line == to.line &&
    e.spans[0].start == from.ch &&
    e.spans[0].end == to.ch
  )

  if (type && element.type !== type) element = undefined

  return element

}



/**
 * Get array of "elements" for the line. 
 * E.g. emphasis, link-inline, image-reference-full.
 * We build them up from tokens.
 * Elements contain 1 or more child spans.
 * E.g. `url` and `title` are child spans of a link element.
 */
export function getLineElements(cm, line, type = undefined) {

  let elements = []
  const tokenPairs = getElementTokens(cm, line)

  // console.log('-------')
  // if (tokenPairs.length) console.log(tokenPairs)

  tokenPairs.forEach((tokenPair) => {
    const { start: startToken, end: endToken, type, tokens } = tokenPair
    const markdown = cm.getRange(Pos(line, startToken.start), Pos(line, endToken.end))

    const classes = startToken.type.split(' ').filter((c) => !c.includesAny('md', '-start'))
    const element = {
      start: startToken.start,
      end: endToken.end,
      line,
      type,
      markdown,
      classes,
      isIncomplete: classes.includes('incomplete')
    }

    // Figure: Check if images are actually figures.
    // (they're on their own lines.)
    // If yes, set type to 'figure'
    if (classes.includes('line-figure')) {
      // element.type = `${element.type} figure`
      element.type = `figure`
    }

    // Get child spans if type is link or image.
    // Else, define single span consisting of the text inside the `md` characters.

    if (type.includesAny('link', 'image', 'footnote-reference')) {
      element.spans = getChildSpans(cm, tokens)
    } else {

      // If element isIncomplete, create empty placeholder
      // span that sits between the start/end md tokens.
      // This is what wizard will target to populate.

      if (element.isIncomplete) {
        element.spans = [{ start: endToken.start, end: endToken.start }]
      } else {
        const firstNonFormattingToken = tokens.find((t) => !t.type.includes('md'))
        const lastNonFormattingToken = [...tokens].reverse().find((t) => !t.type.includes('md'))
        if (firstNonFormattingToken) {
          element.spans = [{
            start: firstNonFormattingToken.start,
            end: lastNonFormattingToken.end,
          }]
        }
      }
    }

    // Get span's strings. E.g. Child string of URL 
    // in [Apple](http://apple.com) is "http://apple.com".
    element.spans?.forEach((s) => {
      // Set `string`
      s.string = markdown.slice(
        s.start - element.start,
        s.start - element.start + (s.end - s.start)
      )
      // Set `line`
      s.line = element.line
    })

    // Define mark details

    element.mark = {
      isMarkable: element.type.equalsAny(...markableElements) || element.type.includes('figure'),
      // isMarkable: element.type.equalsAny('link-inline', 'link-reference-full', 'link-reference-collapsed', 'image-inline', 'image-reference-full', 'image-reference-collapsed', 'footnote-inline', 'footnote-reference', 'citation') || element.type.includes('figure'),
      isEditable: element.type.includesAny('link', 'figure'),
      hasWizard: !element.type.includes('task'),
    }

    // Define mark.displaySpanName
    if (element.mark.isEditable) {
      if (element.type.includesAny('shortcut', 'collapsed')) {
        element.mark.displayedSpanName = 'label'
      } else {
        element.mark.displayedSpanName = 'text'
      }
    }

    elements.push(element)
  })

  // Filter by optional `type` argument if it was provided
  if (type) {
    elements = elements.filter((e) => e.type.includes(type))
  }

  // if (elements.length) elements.forEach((e) => console.log(e))

  return elements
}







/**
 * For given line, go through tokens, and find tokens that start elements.
 * For each of the starts, find the end token.
 * @param {*} cm 
 * @param {*} line 
 * @param {*} lineTokens - Can pass in. Else will get. 
 * @returns 
 */
export function getElementTokens(cm, line, lineTokens = undefined) {

  let startEndTokenPairs = []
  if (!lineTokens) {
    lineTokens = cm.getLineTokens(line).filter((t) => t.type !== null)
  }

  // if (lineTokens.length) console.log(lineTokens)

  for (var i = 0; i < lineTokens.length; i++) {

    // Find start token
    const t = lineTokens[i]
    const prevT = lineTokens[i - 1]
    const isStartToken =
      t.type.includes('-start') && !prevT?.type.includes('-start') && !t.type.includes('frontmatter') ||
      t.type == 'bare-url' && prevT?.type !== 'bare-url' ||
      t.type.includes('task') && !prevT?.type.includes('task') ||
      t.type.includes('tag', 'frontmatter') && !t.type.includesAny('meta', 'atom')

    if (!isStartToken) continue

    // Find matching end token
    if (t.type.includes('-start')) {
      const startType = t.type.match(/[^\s]*?-start/)[0]
      const endType = startType.replace('-start', '-end')
      let endIndex = lineTokens.slice(i).findIndex((t, index) => {
        const nextEl = lineTokens.slice(i)[index + 1]
        // Find last token with correct end type.
        // Check that subsequent character doesn't also have that type.
        // This applies in case of `strong`, which has two closing `*`.
        // We only want the last one.
        return t.type.includes(endType) && !nextEl?.type?.includes(endType)
      })
      endIndex = endIndex == -1 ?
        endIndex = lineTokens.length - 1 :
        endIndex += i
      startEndTokenPairs.push({
        start: t,
        end: lineTokens[endIndex],
        type: startType.replace('-start', ''),
        tokens: lineTokens.slice(i, endIndex + 1)
      })
    } else if (t.type == 'bare-url') {

      let endIndex = lineTokens.slice(i).findIndex((t) => !t.type.includes('bare-url'))
      endIndex = endIndex == -1 ?
        endIndex = lineTokens.length - 1 :
        endIndex += i
      startEndTokenPairs.push({
        start: t,
        end: lineTokens[endIndex],
        type: 'bare-url',
        tokens: lineTokens.slice(i, endIndex + 1)
      })

    } else if (t.type.includes('task')) {

      const endIndex = findLastIndex(lineTokens, (t) => t.type.includes('task'))
      startEndTokenPairs.push({
        start: t,
        end: lineTokens[endIndex],
        type: 'task',
        tokens: lineTokens.slice(i, endIndex + 1)
      })

    } else if (t.type.includesAll('tag', 'frontmatter')) {

      startEndTokenPairs.push({
        start: t,
        end: t,
        type: 'frontmatter-tag',
        tokens: [t]
      })

    }
  }

  return startEndTokenPairs
}


/**
 * Return array of "child spans" for the element.
 * Applies to compound elements like links, which have title, url, etc.
 * Each return object has `start`, `end`, and `type`.
 */
function getChildSpans(cm, tokens) {
  let spans = []
  tokens = tokens.filter((t) => !t.type.includes('md'))
  var i = 0
  while (i < tokens.length) {
    const token = tokens[i]
    const type = token.type
    let indexOfEnd = tokens.slice(i).findIndex((t) => t.type !== type)
    if (indexOfEnd !== -1) {
      indexOfEnd += i
      spans.push({
        start: token.start,
        end: tokens[indexOfEnd - 1].end,
        type
      })
      i = indexOfEnd
    } else {
      spans.push({
        start: token.start,
        end: tokens[tokens.length - 1].end,
        type
      })
      break
    }
  }

  return spans
}
