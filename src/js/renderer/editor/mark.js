import { getLineElements, getLineSpans } from "./editor-utils"
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
export function markDoc2(cm) {

  if (window.state.sourceMode) return

  // Clear existing marks
  cm.getAllMarks().forEach((mark) => mark.clear())

  cm.operation(() => {
    cm.eachLine((lineHandle) => markLine2(cm, lineHandle))
  })
}


/**
 * Find the specified line, find and replace elements that 
 * have `isMarked` true with interactive Svelte components.
 * Before: `[Apple](https://apple.com "Computers!")`
 * After:  `Apple`
 */
export function markLine2(cm, lineHandle) {

  const elements = getLineElements(cm, lineHandle)

  // Only create elements if sourceMode is off.
  if (window.state.sourceMode || !elements) return

  for (const [index, element] of elements.entries()) {

    // Ignore elements that are not isMarked true
    if (!element.isMarked) continue

    const frag = document.createDocumentFragment()

    // Determine what Component to use, for the replacement
    if (element.type == 'task') {
      var component = new Task({
        target: frag,
        props: { cm, element }
      })
    } else if (!element.type.includes('definition')) {
      var component = new Mark({
        target: frag,
        props: { cm, element }
      })
    }

    // Create the TextMarker
    const { line, start, end } = element
    const mark = cm.markText(
      { line, ch: start },
      { line, ch: end },
      {
        replacedWith: frag,
        handleMouseEvents: false,
      }
    )
    mark.component = component
    mark.replacedWith = mark.widgetNode.firstChild

  }
}


/**
 * Clear marks from a line
 */
export function clearLineMarks(cm, lineHandle) {
  const lineNo = lineHandle.lineNo()
  const lineMarks = cm.findMarks(
    { line: lineNo, ch: 0 },
    { line: lineNo, ch: lineHandle.text.length }
  )
  lineMarks.forEach((m) => m.clear())
}












// -------- OLD -------- //


/**
 * Mark selected line
 */
export function markLine(cm, lineHandle) {

  if (window.state.sourceMode) return

  const lineNo = lineHandle.lineNo()

  let citations = []
  let footnotes = []
  let images = []
  let links = []
  let tasks = []

  cm.state.inlineElements.forEach((e) => {
    if (e.line !== lineNo) return
    if (e.type.includes('citation')) {
      citations.push(e)
    } else if (e.type.includes('footnote')) {
      footnotes.push(e)
    } else if (e.type.includes('image')) {
      images.push(e)
    } else if (e.type.includes('link') && !e.type.includes('image')) {
      links.push(e)
    } else if (e.type.includes('task')) {
      tasks.push(e)
    }
  })

  if (citations.length) markText(cm, lineNo, citations, 'citations')
  if (footnotes.length) markText(cm, lineNo, footnotes, 'footnotes')
  if (images.length) markText(cm, lineNo, images, 'images')
  if (links.length) markText(cm, lineNo, links, 'links')
  if (tasks.length) markText(cm, lineNo, tasks, 'tasks')
}


/**
 * Create TextMarkers 
 */
export function markText(cm, lineNo, elements, type) {

  const cursor = cm.getCursor()

  elements.forEach((e) => {

    // -------- PROPERTIES -------- //

    // Shared
    e.mark = {
      editable: false,
      displayedString: '',
      element: undefined,
      classes: []
    }

    // Set `editable`
    switch (type) {
      case 'links':
        e.mark.editable = true
        e.mark.arrowInto = arrowedInto // Method
        break
      case 'tasks':
      case 'images':
      case 'footnotes':
      case 'citations':
        e.mark.editable = false
        break
    }

    // Set `content` and `displayedString`
    if (!e.mark.editable) {

      switch (type) {
        case 'images':
          e.mark.displayedString = 'i'
          break
        case 'footnotes':
          e.mark.displayedString = ''
          break
        case 'citations':
          e.mark.displayedString = 'c'
          break
      }

    } else {

      // The `e.mark.content` property is a reference to the property from the original link that we display and edit. In the case of inline and full reference links, it is the `text` property. For collapsed and shortcut reference links, it is the `label`.
      if (e.type.includes('inline') || e.type.includes('reference-full')) {
        e.mark.content = e.text
      } else if (e.type.includes('reference-collapsed') || e.type.includes('reference-shortcut')) {
        e.mark.content = e.label
      }

      e.mark.displayedString = e.mark.content.string

    }

    // Set classes
    switch (type) {
      case 'citations':
        e.mark.classes.push('cm-citation', 'mark')
        break
      case 'footnotes':
        e.mark.classes.push('cm-footnote', 'mark')
        e.mark.classes.push(e.type.includes('inline') ? 'inline' : 'reference')
        break
      case 'images':
        e.mark.classes.push('cm-image', 'mark')
        e.mark.classes.push(e.type.includes('inline') ? 'inline' : 'reference')
        break
      case 'links':
        e.mark.classes.push('cm-link', 'mark')
        e.mark.classes.push(e.type.includes('inline') ? 'inline' : 'reference')
        break
      case 'tasks':
        e.mark.classes.push('cm-task', 'mark')
        break
    }

    if (e.mark.editable) e.mark.classes.push('editable')
    if (e.error) e.mark.classes.push('error')


    // -------- CREATE MARK -------- //

    const frag = document.createDocumentFragment();
    const wrapper = e.mark.element = document.createElement('span');
    e.mark.classes.forEach((c) => wrapper.classList.add(c))
    wrapper.innerText = `${e.mark.displayedString}`
    wrapper.setAttribute('tabindex', -1)
    frag.append(wrapper)

    if (e.mark.editable) {
      wrapper.setAttribute('contenteditable', true)
    }

    if (e.type.includes('reference')) {
      const arrow = document.createElement('span')
      // arrow.className = wrapper.className
      arrow.classList.add('select')
      wrapper.append(arrow)
    }

    if (type == 'tasks') {

      frag = document.createDocumentFragment()
      const tasks = new Task({
        target: frag,
        props: {
          cm,
          classes: e.mark.classes,
          line: e.line,
          start: e.start,
          end: e.end,
          checked: e.type == 'taskClosed'
        }
      })

      // Mark text
      cm.markText({ line: lineNo, ch: e.start }, { line: lineNo, ch: e.end }, {
        replacedWith: frag,
        handleMouseEvents: false,
      })
    } else {

      // Mark text
      cm.markText({ line: lineNo, ch: e.start }, { line: lineNo, ch: e.end }, {
        replacedWith: frag,
        handleMouseEvents: false,
      })
    }


    // -------- POSITION CURSOR -------- //

    // Position cursor inside `contenteditable` at same position, if the mark is editable, and cursor was inside the new mark's start/stop values.
    if (e.mark.editable) {
      const cursorPosWasInsideNewInputRange = cursor.line == lineNo && cursor.ch > e.start && cursor.ch < (e.start + wrapper.innerText.length + 2)

      if (cursorPosWasInsideNewInputRange) {
        setTimeout(() => {
          const range = document.createRange()
          const sel = window.getSelection()
          range.setStart(wrapper.childNodes[0], cursor.ch - e.start - 1)
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
          wrapper.focus()
        }, 0)
      }
    }


    // -------- CREATE LISTENER: EDITOR STATE CHANGES -------- //

    cm.on('stateChanged', (changed) => {
      if (changed.includes('mark')) {
        if (cm.state.mark.target == e && cm.state.mark.isSelected) {
          highlight()
        }
      } else if (changed.includes('selections')) {
        cm.state.selections.forEach((s) => {

          let from, to

          // Each selection gives a head and anchor objects, with `line` and `ch`. We need to figure out which is `from`, and which is `to`. From is whichever is on the earlier line. Or, if anchor and head are on same line, from is whichever has the earlier character.
          if (s.anchor.line < s.head.line) {
            from = s.anchor
            to = s.head
          } else if (s.anchor.line > s.head.line) {
            from = s.head
            to = s.anchor
          } else if (s.anchor.line == s.head.line) {
            from = s.anchor.ch <= s.head.ch ? s.anchor : s.head
            to = s.anchor.ch >= s.head.ch ? s.anchor : s.head
          }

          let isInsideSelection = false

          const isSingleLineSelection = from.line == to.line
          if (isSingleLineSelection) {
            isInsideSelection = e.line == from.line && e.start >= from.ch && e.end <= to.ch
          } else {
            if (e.line > from.line && e.line < to.line) {
              isInsideSelection = true
            } else if (e.line == from.line && e.start >= from.ch) {
              isInsideSelection = true
            } else if (e.line == to.line && e.end <= to.ch) {
              isInsideSelection = true
            }
          }

          if (isInsideSelection) {
            highlight()
          } else {
            deHighlight()
          }
        })
      }
    })


    // -------- UTILITY FUNCTIONS -------- //

    function openURL() {
      const url = e.type.includes('inline') ? e.url.string : e.definition.url.string
      if (url && url !== '') {
        // console.log(`Open URL: ${url}`)
        window.api.send('openUrlInDefaultBrowser', url)
      }
    }

    function highlight() {
      wrapper.classList.add('highlight')
    }

    function deHighlight() {
      wrapper.classList.remove('highlight')
    }

    function deleteSelf() {
      cm.replaceRange('', { line: e.line, ch: e.start }, { line: e.line, ch: e.end })
      cm.focus()
    }

    // Editable-only:

    // Focus contenteditable and place cursor at start or end.
    // Called by editor.js
    function arrowedInto(sideWeEnterFrom) {
      const placeCursorAt = sideWeEnterFrom == 'right' ? wrapper.innerText.length : 0
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(wrapper.childNodes[0], placeCursorAt);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      wrapper.focus()
    }

    function exitAndWriteChanges(evt) {
      if (wrapper.innerText !== e.mark.content.string) {
        cm.replaceRange(
          wrapper.innerText,
          { line: e.line, ch: e.mark.content.start },
          { line: e.line, ch: e.mark.content.end }
        )
      }
    }

    // -------- EVENT LISTENERS: SHARED -------- //

    // TEMP: Commenting out so I can focus on clicks. Feb 3.
    // wrapper.addEventListener('mouseenter', (evt) => {
    //   cm.dispatch({ type: 'hoverMark', target: e })
    // })

    // wrapper.addEventListener('mouseleave', (evt) => {
    //   cm.dispatch({ type: 'hoverMark', target: null })
    // })

    // Double click: prevent double-clicks from triggering a second mouse down action.
    wrapper.addEventListener('mousedown', (evt) => {
      if (evt.detail > 1 || evt.metaKey) evt.preventDefault()
    })


    // -------- EVENT LISTENERS: NON-EDITABLE MARKS -------- //

    if (!e.mark.editable) {

      // Click
      wrapper.addEventListener('click', (evt) => {
        if (evt.metaKey) {
          evt.preventDefault()
          if (e.type.includes('link') || e.type.includes('image')) {
            openURL()
          }
        } else {
          cm.dispatch({ type: 'selectMark', target: e })
        }
      })
    }


    // -------- EVENT LISTENERS: EDITABLE MARKS -------- //

    if (e.mark.editable) {

      // Click
      wrapper.addEventListener('click', (evt) => {
        if (evt.metaKey) {
          evt.preventDefault()
          if (e.type.includes('link') || e.type.includes('image')) {
            openURL()
          }
        } else {
          // Clear existing editor text selection, otherwise it will remain visible while the cursor is inside the contenteditable.
          cm.setCursor(e.line, e.end)
          // contenteditable will focus automatically
        }
      })

      // Double-click
      wrapper.addEventListener('dblclick', (evt) => {
        if (!evt.metaKey) {
          cm.dispatch({ type: 'selectMark', target: e })
        }
      })

      // Keydown
      wrapper.addEventListener('keydown', (evt) => {

        if (evt.key == 'Backspace' || evt.key == 'Delete') {
          // Delete self on backspace or delete keydown, if focused
          if (document.activeElement == wrapper) {
            deleteSelf()
          }
        } else if (evt.key == 'ArrowLeft') {
          const atLeftEdge = window.getSelection().getRangeAt(0).endOffset == 0
          if (atLeftEdge) {
            cm.setCursor(e.line, e.start)
            cm.focus()
          }
        } else if (evt.key == 'ArrowRight') {
          const atRightEdge = window.getSelection().getRangeAt(0).endOffset == wrapper.innerText.length
          if (atRightEdge) {
            cm.setCursor(e.line, e.end)
            cm.focus()
          }
        } else if (evt.key == 'Tab' && evt.altKey) {
          // Forward alt-tab events to `cm` by using undocumented `cm.triggerOnKeyDown` function. Per https://discuss.codemirror.net/t/signal-keydown/548/2. This ensures that alt-tab events work consistently, from user-pov, regardless of what element is focused (cm or widget).
          evt.preventDefault()
          cm.triggerOnKeyDown({ type: 'keydown', keyCode: 9, altKey: true, shiftKey: evt.shiftKey })
        }
      })


      // Add `{ once: true }` to prevent errors when clicking outside the edited field.
      wrapper.addEventListener('blur', (evt) => {
        exitAndWriteChanges(evt)
      }, { once: true })
    }
  })
}