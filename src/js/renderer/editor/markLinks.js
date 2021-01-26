/**
 * Create TextMarkers for links. 
 */
export default function markLinks(cm, lineHandle) {

  const cursor = cm.getCursor()
  const editorState = cm.getEditorState()
  const sourceMode = editorState.sourceMode
  const lineNo = lineHandle.lineNo()

  if (sourceMode) return

  const elements = editorState.inlineElements.filter((e) => e.line == lineNo && e.type.includes('link') && !e.type.includes('image')
  )

  elements.forEach((e) => {

    // -------- PROPERTIES -------- //

    e.widget = {
      content: {}, // Depends on link type. We set it below.
      editable: true, // Bool
      element: undefined, // DOM element
      arrowInto: arrowedInto // Method
    }

    // The `e.widget.content` property is a reference to the property from the original link that we display and edit. In the case of inline and full reference links, it is the `text` property. For collapsed and shortcut reference links, it is the `label`.
    if (e.type.includes('inline') || e.type.includes('reference-full')) {
      e.widget.content = e.text
    } else if (e.type.includes('reference-collapsed') || e.type.includes('reference-shortcut')) {
      e.widget.content = e.label
    }

    // -------- CREATE TEXTMARKER -------- //

    const frag = document.createDocumentFragment();
    const wrapper = e.widget.element = document.createElement('span');
    wrapper.setAttribute('tabindex', -1)
    wrapper.classList.add('cm-link', 'widget', 'editable', 'wrapper')
    wrapper.classList.add((e.type.includes('inline') ? 'inline' : 'reference'))
    wrapper.innerText = `${e.widget.content.string}`
    wrapper.setAttribute('contenteditable', true)
    wrapper.setAttribute('tabindex', -1)
    frag.append(wrapper)

    // Mark text
    const marker = cm.markText({ line: lineNo, ch: e.start }, { line: lineNo, ch: e.end }, {
      replacedWith: frag,
      handleMouseEvents: false,
    })

    // Position cursor inside contenteditable: If cursor was inside the new widget's start/stop values, place it inside the new contenteditable at the same position.
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


    // -------- STATE CHANGES -------- //

    cm.on('stateChanged', (changed) => {
      if (changed.includes('widget')) {
        if (editorState.widget.target == e && editorState.widget.isSelected) {
          highlight()
        }
      } else if (changed.includes('selections')) {
        editorState.selections.forEach((s) => {

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


    // -------- EVENT LISTENERS -------- //

    // Click
    wrapper.addEventListener('click', clicked)

    // Double click
    wrapper.addEventListener('dblclick', doubleClicked)

    // Hovers: Update `editorState.widget`
    wrapper.addEventListener('mouseenter', (evt) => {
      cm.dispatch({ type: 'hoverWidget', target: e })
    })

    wrapper.addEventListener('mouseleave', (evt) => {
      cm.dispatch({ type: 'hoverWidget', target: null })
    })

    // Double click: prevent double-clicks from triggering a second mouse down action.
    wrapper.addEventListener('mousedown', (evt) => {
      if (evt.detail > 1 || evt.metaKey) evt.preventDefault()
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


    // -------- FUNCTIONS -------- //

    function clicked(evt) {
      if (evt.metaKey) {
        evt.preventDefault()
        openURL()
      } else {
        // Clear existing editor text selection, otherwise it will remain visible while the cursor is inside the contenteditable.
        cm.setCursor(e.line, e.end)
        // contenteditable will focus automatically
      }
    }

    // Highlight and open wizard
    function doubleClicked(evt) {
      if (!evt.metaKey) {
        cm.dispatch({ type: 'selectWidget', target: e })
      }
    }

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

    // Utitlity functions:

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

    function exitAndWriteChanges(evt) {
      if (wrapper.innerText !== e.widget.content.string) {
        cm.replaceRange(
          wrapper.innerText,
          { line: e.line, ch: e.widget.content.start },
          { line: e.line, ch: e.widget.content.end }
        )
      }
    }
  })
}