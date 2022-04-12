import { getLineClasses, getLineElements } from "./map"
import HtmlPreview from './HtmlPreview.svelte'
import Mark from './Mark.svelte'
import EditorBlockOptionsWidget from "../component/main/EditorBlockOptionsWidget.svelte"
import { Pos } from "codemirror"
import { getLastLineOfHtmlBlock } from "./editor-utils"

/**
 * For each line of the doc, check for and create
 * marks. This can include replacing link markup
 * with shortened interactive components, creating
 * previews of html content, etc.
 */
export async function markDoc(cm) {

  // Clear existing marks
  cm.getAllMarks().forEach((mark) => mark.clear())

  // Mark each line
  cm.operation(() => {
    cm.eachLine((lineHandle) => {
      const line = lineHandle.lineNo()
      markLine(cm, line, lineHandle)
    })
  })

  // await wait(150)
  // cm.refresh()
}


/**
 * For the specified line, create marks.
 */
export function markLine(cm, line, lineHandle) {

  const lineClasses = getLineClasses(lineHandle)

  // If line is start of front matter, collapse the front matter
  if (lineClasses.includes('frontmatter-start') && window.state.frontMatterCollapsed) {
    collapseFrontMatter(cm)
  }

  // Replace elements. E.g. links, images, footnotes, etc.
  // Before: `[Apple](https://apple.com "Computers!")`
  // After:  `Apple`
  if (!window.state.sourceMode) {
    const elements = getLineElements(cm, line)
    elements.forEach((element) => markElement(cm, element))
  }

  // If line is one of the following, add options widget 
  if (lineClasses.includesAny('frontmatter-start')) {
    addBlockOptionsWidget(cm, 'frontmatter', line)
  } else if (lineClasses.includesAny('fencedcodeblock-start')) {
    addBlockOptionsWidget(cm, 'fencedcodeblock', line)
  } else if (lineClasses.includesAny('figure')) {
    addBlockOptionsWidget(cm, 'figure', line)
  } else if (lineClasses.includes('htmlBlock-firstLine')) {
    // addBlockOptionsWidget(cm, 'html', line)
  }

  if (lineClasses.includesAny('htmlBlock-firstLine')) {
    addHtmlPreview(cm, line)
  }
}


/**
 * Insert a live preview of the htmlBlock.
 * @param {*} cm 
 * @param {*} firstLine 
 */
export function addHtmlPreview(cm, firstLine) {

  if (window.state.sourceMode) return

  // If top-level element is NOT iframe or video, return.
  // We (currently) only support those two elements.
  const firstLineString = cm.getLine(firstLine)
  const isIframe = firstLineString.startsWith('<iframe')
  const isVideo = firstLineString.startsWith('<video')
  if (!isIframe && !isVideo) return

  let lastLine = getLastLineOfHtmlBlock(cm, firstLine)

  // If line widget already exists, return.
  // We don't want to create duplicates.
  const htmlPreviewAlreadyExists = cm.getLineHandle(lastLine).widgets?.length
  if (htmlPreviewAlreadyExists) return

  const frag = document.createDocumentFragment()

  const component = new HtmlPreview({
    target: frag,
    props: {
      cm,
      from: Pos(firstLine, 0)
    }
  })

  const lineWidget = cm.addLineWidget(lastLine, component.domEl, { above: false })

  lineWidget.component = component
  component.lineWidget = lineWidget
}


/**
 * We add "options" to some blocks. E.g. figures, html etc.
 * Options sit to the right, and can include a label
 * (e.g. "HTML"), button for toggling collapsed/open,
 * and button for options.
 * @param {*} cm 
 * @param {String} type - 'fencedcodeblock', 'figure', 'frontmatter'
 * @param {Integer} line - Line number
 * @returns 
 */
export function addBlockOptionsWidget(cm, type, line) {

  const marks = cm.findMarks(Pos(line, 0), Pos(line, 1))
  const optionsWidgetAlreadyExists = marks.length > 0

  if (optionsWidgetAlreadyExists) return

  // Insert component

  const frag = document.createDocumentFragment()

  var component = new EditorBlockOptionsWidget({
    target: frag,
    props: { cm, type }
  })

  const mark = cm.setBookmark(Pos(line, 0), {
    widget: frag,
    // insertLeft: true
  })

  component.mark = mark
  mark.component = component
}


/**
 * Hide the front matter if `state.frontMatterCollapsed` is true
 * @param {*} cm 
 */
function collapseFrontMatter(cm) {

  // Find end line of the front matter
  for (var i = 1; i < cm.lineCount(); i++) {
    const isEnd = getLineClasses(cm.getLineHandle(i)).includes('frontmatter-end')
    if (isEnd) {
      var lastLine = i
      break
    }
  }

  cm.markText(
    Pos(0, 3),
    Pos(lastLine, cm.getLine(lastLine).length),
    {
      collapsed: true
    }
  )
}


/**
 * Mark the element. 
 * How we mark depends on the type.
 */
export function markElement(cm, element) {

  // If element is not markable, or we're in sourceMode, return
  if (!element.mark?.isMarkable || window.state.sourceMode) return

  // const isNotReferenceDefinitonAnchor = !s.classes.includes('reference-definition-anchor-start')
  // const isNotInsideLinkReferenceDefinition = !s.lineClasses.includes('link-reference-definition')

  const frag = document.createDocumentFragment()

  // Create the Svelte component and attach to `frag`
  if (!element.type.includes('definition')) {
    var component = new Mark({
      target: frag,
      props: {
        cm,
        type: element.type,
        classes: element.classes
      }
    })
  }

  // Create the TextMarker
  const { line, start, end } = element
  const textMarker = cm.markText(
    { line, ch: start },
    { line, ch: end },
    {
      replacedWith: frag,
      handleMouseEvents: false,
    }
  )

  // Set properties on the component and TextMarker
  component.textMarker = textMarker
  textMarker.component = component
  textMarker.isEditable = element.mark.isEditable
  textMarker.replacedWith = textMarker.widgetNode.firstChild

  return textMarker
}


/**
 * Clear marks from a line
 */
export function clearLineMarks(cm, lineHandle) {
  const line = lineHandle.lineNo()
  const marks = cm.findMarks(
    { line, ch: 0 },
    { line, ch: lineHandle.text.length }
  )
  marks.forEach((m) => m.clear())
}
