/**
 * Create TextMarkers for links. 
 * Wrapper vs Input: Why two elements? Because wrapper gives us something we can focus, without the cursor kicking in. So we can listen to keyboard events, for example. 
 */
export default function markLinks(cm, lineHandle, elements, sourceMode, cursor) {

  const doc = cm.getDoc()
  const lineNo = lineHandle.lineNo()

  if (elements.length > 0 && !sourceMode) {
    elements.forEach((e) => {

      // -------- PROPERTIES -------- //

      e.widget = {
        // Content. Depends on link type. We set it below.
        content: {},
        // State
        editable: true,
        highlighted: false,
        focused: false,
        // Element
        element: undefined,
        // Methods
        arrowInto: arrowedInto,
        tabInto: tabbedInto,
        selectInsideLargerSelection: selectInsideLargerSelection,
        selectIndividually: selectIndividually,
        highlight: highlight,
        deHighlight: deHighlight,
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
      const input = document.createElement('span');
      input.innerText = `${e.widget.content.string}`
      input.setAttribute('contenteditable', true)
      input.setAttribute('tabindex', -1)
      input.classList.add('input')
      wrapper.append(input)
      frag.append(wrapper)

      // Mark text
      const marker = cm.markText({ line: lineNo, ch: e.start }, { line: lineNo, ch: e.end }, {
        replacedWith: frag,
        handleMouseEvents: false,
      })

      // Position cursor inside input: If cursor was inside the new widget's start/stop values, place it inside the new input at the same position.
      const cursorPosWasInsideNewInputRange = cursor.line == lineNo && cursor.ch > e.start && cursor.ch < (e.start + input.innerText.length + 2)

      if (cursorPosWasInsideNewInputRange) {
        setTimeout(() => {
          const range = document.createRange()
          const sel = window.getSelection()
          range.setStart(input.childNodes[0], cursor.ch - e.start - 1)
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
          input.focus()
        }, 0)
      }


      // -------- EVENT LISTENERS -------- //

      // Click
      wrapper.addEventListener('click', clicked)

      // Double click
      wrapper.addEventListener('dblclick', doubleClicked)

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
        } else if (evt.key == 'ArrowLeft' || evt.key == 'ArrowRight') {
          if (e.widget.highlighted) { // TODO: Not sure when this is called?
            console.log("Arrow key pressed while `e.widget.highlighted == true`")
            // switch (evt.key) {
            //   case 'ArrowLeft':
            //     doc.setCursor(e.line, e.start)
            //     cm.focus()
            //     break
            //   case 'ArrowRight':
            //     doc.setCursor(e.line, e.end)
            //     cm.focus()
            //     break
            // }
          } else {
            switch (evt.key) {
              case 'ArrowLeft':
                const atLeftEdge = window.getSelection().getRangeAt(0).endOffset == 0
                if (atLeftEdge) {
                  doc.setCursor(e.line, e.start)
                  cm.focus()
                }
                break
              case 'ArrowRight':
                const atRightEdge = window.getSelection().getRangeAt(0).endOffset == input.innerText.length
                if (atRightEdge) {
                  doc.setCursor(e.line, e.end)
                  cm.focus()
                }
                break
            }
          }
        } else if (evt.key == 'Tab' && evt.altKey) {
          // Forward alt-tab events to `cm` by using undocumented `cm.triggerOnKeyDown` function. Per https://discuss.codemirror.net/t/signal-keydown/548/2. This ensures that alt-tab events work consistently, from user-pov, regardless of what element is focused (cm or widget).
          evt.preventDefault()
          cm.triggerOnKeyDown({ type: 'keydown', keyCode: 9, altKey: true, shiftKey: evt.shiftKey })
        }
      })

      wrapper.addEventListener('blur', (evt) => {
        deHighlight()
      })

      input.addEventListener('focus', (evt) => {
        e.widget.focused = true
      })

      // Add `{ once: true }` to prevent errors when clicking outside the edited field.
      input.addEventListener('blur', (evt) => {
        exitAndWriteChanges(evt)
      }, { once: true })


      // -------- FUNCTIONS -------- //

      function clicked(evt) {
        if (evt.metaKey) {
          evt.preventDefault()
          openURL()
        } else {
          input.focus()
          // Clear existing editor text selection, otherwise it will remain visible while the cursor is inside the input.
          doc.setCursor(e.line, e.end)
        }
      }

      // Highlight and open wizard
      function doubleClicked(evt) {
        if (evt.metaKey) return
        highlight()
        cm.wizard.show(e)
      }

      // Focus input and place cursor at start or end.
      // Called by editor.js
      function arrowedInto(sideWeEnterFrom) {
        const placeCursorAt = sideWeEnterFrom == 'right' ? input.innerText.length : 0
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(input.childNodes[0], placeCursorAt);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        input.focus()
      }

      // Highlight the mark and place the cursor after it. This won't be visible immediately, because wizard will open, take focus, and therefore hide the cursor inside the editor. But when user exits wizard, this should help ensure cursor is in logical spot (end of the widget).
      function tabbedInto() {
        doc.setCursor(lineNo, e.end)
        highlight()
        cm.wizard.show(e)
      }

      // Utitlity functions:

      function openURL() {
        const url = e.type.includes('inline') ? e.url.string : e.definition.url.string
        if (url && url !== '') {
          // console.log(`Open URL: ${url}`)
          window.api.send('openUrlInDefaultBrowser', url)
        }
      }

      // Select inside larger selection (e.g. while dragging a selection)
      function selectInsideLargerSelection() {
        highlight()
      }

      // Select individually (e.g. try to backspace or delete from outside)
      function selectIndividually() {
        focus()
      }

      function highlight() {
        wrapper.classList.add('highlight')
        e.widget.highlighted = true
      }

      function focus() {
        wrapper.focus()
        e.widget.highlighted = true
      }

      function deHighlight() {
        wrapper.classList.remove('highlight')
        e.widget.highlighted = false
      }

      function deleteSelf() {
        doc.replaceRange('', { line: e.line, ch: e.start }, { line: e.line, ch: e.end })
        cm.focus()
      }

      function exitAndWriteChanges(evt) {
        if (input.innerText !== e.widget.content.string) {
          doc.replaceRange(
            input.innerText,
            { line: e.line, ch: e.widget.content.start },
            { line: e.line, ch: e.widget.content.end }
          )
        }
        e.widget.focused = false
      }
    })
  }
}