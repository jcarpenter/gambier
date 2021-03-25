import { getLineSpans } from "./editor-utils"
import { getLineElements } from "./map"
import markTaskList from "./markTaskList"
import Citation from './marks/Citation.svelte'
import Footnote from './marks/Footnote.svelte'
import Link from './marks/Link.svelte'
import Image from './marks/Image.svelte'
import Task from './marks/Task.svelte'
import Mark from './marks/Mark.svelte'


/**
 * For each line of the doc, find and replace elements that 
 * have `isMarked` true with interactive Svelte components.
 */
export function markDoc(cm) {

  // Clear existing marks
  cm.getAllMarks().forEach((mark) => mark.clear())

  cm.operation(() => {
    cm.eachLine((lineHandle) => markLine(cm, lineHandle.lineNo()))
  })
}


/**
 * Find the specified line, find and replace elements that 
 * have `isMarked` true with interactive Svelte components.
 * Before: `[Apple](https://apple.com "Computers!")`
 * After:  `Apple`
 */
export function markLine(cm, line) {
  const elements = getLineElements(cm, line)
  elements.forEach((element) => markElement(cm, element))
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
  if (element.type == 'task') {
    var component = new Task({
      target: frag,
      props: { cm, element }
    })
  } else if (!element.type.includes('definition')) {
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
  textMarker.replacedWith = textMarker.widgetNode.firstChild

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
