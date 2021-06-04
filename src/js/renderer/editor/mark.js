import { getLineClasses, getLineElements, getSpansAt } from "./map"
import markTaskList from "./markTaskList"
import Citation from './marks/Citation.svelte'
import Footnote from './marks/Footnote.svelte'
import Link from './marks/Link.svelte'
import Image from './marks/Image.svelte'
import Task from './marks/Task.svelte'
import Mark from './marks/Mark.svelte'
import ImagePreview from "../component/main/wizard/ImagePreview.svelte"
import SyntaxSelect from "../component/main/SyntaxSelect.svelte"
import FrontMatterToggleCollapsed from "../component/main/FrontMatterToggleCollapsed.svelte"
import EditorBlockOptionsWidget from "../component/main/EditorBlockOptionsWidget.svelte"
import { Pos } from "codemirror"

/**
 * For each line of the doc, find and replace elements that 
 * have `isMarked` true with interactive Svelte components.
 */
export function markDoc(cm) {

  // Clear existing marks
  cm.getAllMarks().forEach((mark) => mark.clear())

  // Mark each line
  cm.operation(() => {
    cm.eachLine((lineHandle) => {
      const line = lineHandle.lineNo()
      markLine(cm, line, lineHandle)
    })
  })
}



/**
 * Find the specified line, find and replace elements that 
 * have `isMarked` true with interactive Svelte components.
 * Before: `[Apple](https://apple.com "Computers!")`
 * After:  `Apple`
 */
export function markLine(cm, line, lineHandle) {
  
  const lineClasses = getLineClasses(lineHandle)

  // If line is start of front matter, collapse the front matter
  if (lineClasses.includes('frontmatter-start') && window.state.frontMatterCollapsed) {
    collapseFrontMatter(cm)
  }

  // Mark elements
  const elements = getLineElements(cm, line)
  elements.forEach((element) => markElement(cm, element))
  
  // If line is one of the following, add options widget 
  if (lineClasses.includesAny('frontmatter-start')) {
    addBlockOptionsWidget(cm, 'frontmatter', line)
  } else if (lineClasses.includesAny('fencedcodeblock-start')) {
    addBlockOptionsWidget(cm, 'fencedcodeblock', line)
  } else if (lineClasses.includesAny('figure')) {
    addBlockOptionsWidget(cm, 'figure', line)
  }
}


/**
 * We add "block options" to fenced code blocks, figures, and front matter.
 * Depending on the type, the options component can include label, 
 * toggle-collapsed button, etc.
 * @param {*} cm 
 * @param {String} type - 'fencedcodeblock', 'figure', 'frontmatter'
 * @param {Integer} line - Line number
 * @returns 
 */
export function addBlockOptionsWidget(cm, type, line) {
  
  const marks = cm.findMarks(Pos(line, 0), Pos(line, 1))
  const optionsWidgetAlreadyExists = marks.length > 0
  
  if (optionsWidgetAlreadyExists) return 
  
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
 * Create syntax-select menu on opening line of fenced code block line.
 */
// function markFencedCodeBlock(cm, line, lineTokens) {

//   // If this isn't start of fenced code block, return
//   const isStartOfFencedCodeBlock = lineTokens[0].type.includes('line-fencedcodeblock-start')
//   if (!isStartOfFencedCodeBlock) return

//   // If mark already exists, do nothing
//   const marks = cm.findMarks(Pos(line, 0), Pos(line, lineTokens[0].end))

//   if (!marks.length) {

//     const frag = document.createDocumentFragment()

//     var component = new SyntaxSelect({
//       target: frag,
//       props: {
//         cm
//       }
//     })

//     const mark = cm.setBookmark(Pos(line, 0), {
//       widget: frag,
//       insertLeft: true
//     })

//     component.mark = mark
//   }
// }

/**
 * Mark the element. 
 * How we mark depends on the type.
 */
export function markElement(cm, element) {

  // console.log('markElement, cm: ', cm)

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
