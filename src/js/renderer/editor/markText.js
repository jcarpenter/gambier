/**
 * Create TextMarkers for links. 
 */
export default function markText(cm, lineNo, elements, type) {

  const cursor = cm.getCursor()
  const editorState = cm.getEditorState()
  const sourceMode = editorState.sourceMode

  if (sourceMode) return

  elements.forEach((e) => {


    // -------- PROPERTIES -------- //

    // if (type == 'links') console.log(e)

    // Shared
    e.widget = {
      editable: false,
      displayedString: '',
      element: undefined,
      classes: []
    }

    // Set `editable`
    switch (type) {
      case 'links':
        e.widget.editable = true
        e.widget.arrowInto = arrowedInto // Method
        break
      case 'images':
      case 'footnotes':
      case 'citations':
        e.widget.editable = false
        break
    }

    // Set `content` and `displayedString`
    if (!e.widget.editable) {

      switch (type) {
        case 'images':
          e.widget.displayedString = 'i'
          break
        case 'footnotes':
          e.widget.displayedString = ''
          break
        case 'citations':
          e.widget.displayedString = 'c'
          break
      }

    } else {

      // The `e.widget.content` property is a reference to the property from the original link that we display and edit. In the case of inline and full reference links, it is the `text` property. For collapsed and shortcut reference links, it is the `label`.
      if (e.type.includes('inline') || e.type.includes('reference-full')) {
        e.widget.content = e.text
      } else if (e.type.includes('reference-collapsed') || e.type.includes('reference-shortcut')) {
        e.widget.content = e.label
      }

      e.widget.displayedString = e.widget.content.string

    }

    // Set classes
    switch (type) {
      case 'links':
        e.widget.classes.push('cm-link', 'widget')
        e.widget.classes.push(e.type.includes('inline') ? 'inline' : 'reference')
        break
      case 'images':
        e.widget.classes.push('cm-image', 'widget')
        e.widget.classes.push(e.type.includes('inline') ? 'inline' : 'reference')
        break
      case 'footnotes':
        e.widget.classes.push('cm-footnote', 'widget')
        e.widget.classes.push(e.type.includes('inline') ? 'inline' : 'reference')
        break
      case 'citations':
        e.widget.classes.push('cm-citation', 'widget')
        break
    }

    if (e.widget.editable) e.widget.classes.push('editable')
    if (e.error) e.widget.classes.push('error')


    // -------- CREATE TEXTMARKER -------- //

    const frag = document.createDocumentFragment();
    const wrapper = e.widget.element = document.createElement('span');
    e.widget.classes.forEach((c) => wrapper.classList.add(c))
    wrapper.innerText = `${e.widget.displayedString}`
    wrapper.setAttribute('tabindex', -1)
    frag.append(wrapper)

    if (e.widget.editable) {
      wrapper.setAttribute('contenteditable', true)
    }

    if (e.type.includes('reference')) {
      const arrow = document.createElement('span')
      // arrow.className = wrapper.className
      arrow.classList.add('select')
      wrapper.append(arrow)
    }

    // Mark text
    cm.markText({ line: lineNo, ch: e.start }, { line: lineNo, ch: e.end }, {
      replacedWith: frag,
      handleMouseEvents: false,
    })


    // -------- POSITION CURSOR -------- //

    // Position cursor inside `contenteditable` at same position, if the widget is editable, and cursor was inside the new widget's start/stop values.
    if (e.widget.editable) {
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
      if (wrapper.innerText !== e.widget.content.string) {
        cm.replaceRange(
          wrapper.innerText,
          { line: e.line, ch: e.widget.content.start },
          { line: e.line, ch: e.widget.content.end }
        )
      }
    }

    // -------- EVENT LISTENERS: SHARED -------- //

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


    // -------- EVENT LISTENERS: NON-EDITABLE -------- //

    if (!e.widget.editable) {

      // Click
      wrapper.addEventListener('click', (evt) => {
        if (evt.metaKey) {
          evt.preventDefault()
          if (e.type.includes('link') || e.type.includes('image')) {
            openURL()
          }
        } else {
          cm.dispatch({ type: 'selectWidget', target: e })
        }
      })
    }


    // -------- EVENT LISTENERS: EDITABLE -------- //

    if (e.widget.editable) {

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
          cm.dispatch({ type: 'selectWidget', target: e })
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