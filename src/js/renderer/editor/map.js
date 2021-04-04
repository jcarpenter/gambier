
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
 * Get element at specified line and ch
 */
export function getElementAt(cm, line, ch) {
  const lineElements = getLineElements(cm, line)
  const element = lineElements.find((e) =>
    e.line == line &&
    e.start < ch &&
    e.end > ch
  )
  return element
}

/**
 * Same as above, but return an array of all elements found.
 * Useful when we want to check for nested elements.
 * As in case of footnotes containing other elements.
 */
export function getElementsAt(cm, line, ch) {
  const lineElements = getLineElements(cm, line)
  const elements = lineElements.filter((e) =>
    e.line == line &&
    e.start < ch &&
    e.end > ch
  )
  return elements
}

/**
 * Return element matching the exact range 
 * @param {*} matchExactly - Bool. If true, looks for element matching
 * exact from/to positions, and returns that element (instead of array).
 */
export function getElementsInsideRange(cm, from, to, matchExactly = false) {
  const lineElements = getLineElements(cm, from.line)
  if (matchExactly) {
    return lineElements.find((e) =>
      e.line == from.line &&
      e.start == from.ch &&
      e.end == to.ch
    )
  } else {
    return lineElements.filter((e) =>
      e.line == from.line &&
      e.start >= from.ch &&
      e.end <= to.ch
    )
  }
}



/**
 * Get array of "elements" for the line. 
 * E.g. emphasis, link-inline, image-reference-full.
 * Elements contain 1 or more child spans.
 * E.g. `url` and `title` are child spans of a link element.
 */
export function getLineElements(cm, line) {

  let elements = []
  const tokenPairs = getElementTokens(cm, line)

  // console.log(tokenPairs)

  tokenPairs.forEach((tokenPair) => {
    const { start: startToken, end: endToken, type, tokens } = tokenPair
    const markdown = cm.getRange({ line, ch: startToken.start }, { line, ch: endToken.end })
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

    // Define child strings 
    // E.g. Child string of **hello world** is "hello world".
    element.spans.forEach((s) => {
      s.string = markdown.slice(
        s.start - element.start,
        s.start - element.start + (s.end - s.start)
      )
    })

    // Define mark details

    element.mark = {
      isMarkable: type.equalsAny('link-inline', 'link-reference-full', 'link-reference-collapsed', 'image-inline', 'image-reference-full', 'image-reference-collapsed', 'footnote-inline', 'footnote-reference', 'citation'),
      isEditable: type.includesAny('link'),
    }

    // Define mark.displaySpanName
    if (element.type.includes('link')) {
      if (element.type.includesAny('shortcut', 'collapsed')) {
        element.mark.displayedSpanName = 'label'
      } else {
        element.mark.displayedSpanName = 'text'
      }
    }

    elements.push(element)
  })

  return elements
}


export function getElementTokens(cm, line) {

  // For given line, go through tokens, and find tokens that start elements.
  // For each of the starts, find the end token.
  let startEndTokenPairs = []
  const lineTokens = cm.getLineTokens(line).filter((t) => t.type !== null)

  for (var i = 0; i < lineTokens.length; i++) {

    const t = lineTokens[i]
    const prevT = lineTokens[i - 1]
    const isStartToken =
      t.type.includes('-start') && !prevT?.type.includes('-start') ||
      t.type == 'bare-url' && prevT?.type !== 'bare-url' ||
      t.type == 'task' && prevT?.type !== 'task'

    if (!isStartToken) continue

    if (t.type.includes('-start')) {
      const startType = t.type.match(/[^\s]*?-start/)[0]
      const endType = startType.replace('-start', '-end')
      // console.log(endType)
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
    } else if (t.type == 'task') {
      const endIndex = lineTokens.slice(i).findIndex((t) => !t.type.includes('task')) + i - 1
      startEndTokenPairs.push({
        start: t,
        end: lineTokens[endIndex],
        type: 'task',
        tokens: lineTokens.slice(i, endIndex + 1)
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
export function getChildSpans(cm, tokens) {
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
