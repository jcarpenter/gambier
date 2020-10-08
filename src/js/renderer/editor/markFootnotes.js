/* 

- Non-editable widgets.
- Single-click to open.
- Arrow around them (not into them).
- Highlight on drag selection.

TODO

- Differentiate inline vs reference
- Add dedicated class for non-editable widgets?
*/

export default function markFootnotes(cm, lineHandle, elements, sourceMode, cursor) {

  const doc = cm.getDoc()
  const lineNo = lineHandle.lineNo()
  const lineHasBlockStyles = lineHandle.styleClasses !== undefined

  if (elements.length > 0 && !lineHasBlockStyles && !sourceMode) {
    elements.forEach((e) => {

      // -------- PROPERTIES -------- //

      e.widget = {
        // Content. Depends on link type. We set it below.
        content: {},
        // State
        editable: false,
        highlighted: false,
        focused: false,
        // Elements
        element: undefined,
        // Methods
        // arrowInto: arrowedInto,
        tabInto: tabbedInto,
        selectInsideLargerSelection: selectInsideLargerSelection,
        selectIndividually: selectIndividually,
        highlight: highlight,
        deHighlight: deHighlight,
      }

      // -------- CREATE TEXTMARKER -------- //

      const frag = document.createDocumentFragment();
      const wrapper = e.widget.element = document.createElement('span');
      wrapper.setAttribute('tabindex', -1)
      wrapper.classList.add('cm-footnote', 'widget', 'icon', 'wrapper')
      wrapper.classList.add((e.type.includes('inline') ? 'inline' : 'reference'))
      frag.append(wrapper)

      // Mark text
      const marker = cm.markText({ line: lineNo, ch: e.start }, { line: lineNo, ch: e.end }, {
        replacedWith: frag,
        handleMouseEvents: false,
      })

      // -------- EVENT LISTENERS -------- //

      /* Tricky section here!
      - We need the wrapper to be focusable. Because when it's "selected" (e.g. when we tab to it), we want to take focus away from `cm` (the editor). So wrapper has tabindex -1. 
      - BUT, we don't want clicking the wrapper to focus it. Because we immediately lose that focus when the wizard then opens. 
      - A lot of the following complexity is about managing that dance.
      */

      // Click
      wrapper.addEventListener('click', clicked)

      // Double click
      wrapper.addEventListener('mousedown', (evt) => {
        
        // PreventDefault() inside mousedown helps prevent two nasty double-click glitches: 1) flicking the wizard off/on, and 2) selecting the text behind the widget.
        evt.preventDefault()

        // If another element is focused, blur it. This can happen, for example, if another widget was already selected when we clicked on this widget. We want that other widget to be deselected. Normally we'd get this for free, when focus changes to the wrapper on click. But we've disabled that behaviour with `preventDefault()`, above. So we have to blur the element manually. 
        
        // We first make sure the `document.activeElement` isn't this widget or the wizard. If we don't do this, we'd trigger this when the wizard is focused on this widget, triggering an off/on flicker (which we don't want).
        const activeElement = document.activeElement
        if (activeElement !== wrapper && activeElement !== cm.wizard.element) {
          activeElement.blur()
        } 
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
                doc.setCursor(e.line, e.start)
                cm.focus()
                break
              case 'ArrowRight':
                doc.setCursor(e.line, e.end)
                cm.focus()
                break
            }
          }
        } else if (evt.key == 'Tab' && evt.altKey) {
          // Forward alt-tab events to `cm` by using undocumented `cm.triggerOnKeyDown` function. Per https://discuss.codemirror.net/t/signal-keydown/548/2. This ensures that alt-tab events work consistently, from user-pov, regardless of what element is focused (cm or widget).
          evt.preventDefault()
          cm.triggerOnKeyDown({ type: 'keydown', keyCode: 9, altKey: true, shiftKey: evt.shiftKey })
        }
      })

      wrapper.addEventListener('focus', (evt) => {
        deHighlight()
      })

      wrapper.addEventListener('blur', (evt) => {
        deHighlight()
      })

      // -------- FUNCTIONS -------- //

      function clicked(evt) {
        // evt.preventDefault()
        if (e.type.includes('reference') && evt.metaKey) {
          jumpToDefinition()
        } else {
          console.log('Hi')
          // Clear existing editor text selection, otherwise it will remain visible while the cursor is inside the input.
          doc.setCursor(e.line, e.end)
          highlight()
          cm.wizard.show(e)
        }
      }

      // Highlight the mark and place the cursor after it. This won't be visible immediately, because wizard will open, take focus, and therefore hide the cursor inside the editor. But when user exits wizard, this should help ensure cursor is in logical spot (end of the widget).
      function tabbedInto() {
        doc.setCursor(lineNo, e.end)
        highlight()
        cm.wizard.show(e)
      }

      // Utitlity functions:

      function jumpToDefinition() {
        console.log(e.definition)
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

    })
  }
}