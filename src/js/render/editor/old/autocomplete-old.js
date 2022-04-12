import Autocomplete from './marks/Autocomplete.svelte'

export function showAutocomplete(cm, from, to, changeText, removed) {

  // -------- MENU -------- //

  // Set initial options
  // const menuItems = {
  //   selectedIndex: 0,
  //   list: {
  //     0: {
  //       label: 'Link',
  //       preview: '[...](...)',
  //     },
  //     1: {
  //       label: 'Image',
  //       preview: '![...](...)',
  //     },
  //     2: {
  //       label: 'Footnote',
  //       preview: '^[...]',
  //     },
  //     3: {
  //       label: 'Citation',
  //       preview: '[@...]',
  //     },
  //     length: 4
  //   },
  // }

  // cm.autocomplete.menu.menuItems = menuItems

  // Set position
  // const paddingOnLeftSideOfEditor = cm.display.lineSpace.offsetLeft
  // cm.autocomplete.menu.element.style.top = `${cm.cursorCoords(true, 'local').bottom}px`
  // cm.autocomplete.menu.element.style.left = `${autocomplete.offsetLeft + paddingOnLeftSideOfEditor}px`

  // Show
  cm.autocomplete.show()


  // const frag = document.createDocumentFragment()

  // var component = new Autocomplete({
  //   target: frag,
  //   props: { 
  //     cm,

  //   }
  // })

  // const mark = cm.markText(from, to,
  //   {
  //     replacedWith: frag,
  //     handleMouseEvents: false,
  //   }
  // )

}


/**
 * Insert widget via `markText` at cursor position. But only if there's either 1) no selection, or 2) a single seleciton. If there are multiple selections, just wrap them in brackets with replaceRange, and don't show the automcomplete widget.
 * @param {*} cm 
 */
export function showAutocompleteOld(cm, text) {


  const doc = cm.getDoc()

  let clickedOutside = false

  const from = {
    line: doc.getCursor('from').line,
    ch: doc.getCursor('from').ch - 1,
  }

  const to = {
    line: doc.getCursor('to').line,
    ch: doc.getCursor('to').ch + 1,
  }

  // console.log(from)
  // console.log(getCharAt(cm, from.line, from.ch))
  // console.log(to)
  // console.log(getCharAt(cm, to.line, to.ch))



  // -------- CREATE TEXTMARKER -------- //

  const frag = document.createDocumentFragment();
  const autocomplete = document.createElement('span')
  autocomplete.id = 'autocomplete';
  autocomplete.setAttribute('contenteditable', true)
  autocomplete.innerText = text
  frag.appendChild(autocomplete)

  // Position cursor inside input
  // TODO: Replicate selection of cursor before. It will either be 1) at start, in case of empty brackets, or 2) selecting all the text, in case of brackets being applied to a selection.
  setTimeout(() => {
    const range = document.createRange()
    const sel = window.getSelection()
    range.setStart(autocomplete.childNodes[0], text.length - 1)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    autocomplete.focus()
  }, 0)

  // Mark text
  const mark = cm.markText(from, to, {
    replacedWith: frag,
    handleMouseEvents: false
  })


  // -------- EVENTS -------- //

  autocomplete.addEventListener('keydown', (evt) => {
    switch (evt.key) {
      case 'z':
        if (evt.metaKey) {
          onUndo()
        }
        break
      case 'Escape':
        evt.preventDefault()
        onEscape()
        break
      case 'Enter':
        evt.preventDefault()
        onEnter()
        break
      case 'ArrowUp':
        evt.preventDefault()
        if (menuItems.selectedIndex > 0) {
          menuItems.selectedIndex--
          cm.autocomplete.menu.menuItems = menuItems
        }
        break
      case 'ArrowDown':
        evt.preventDefault()
        if (menuItems.selectedIndex < menuItems.list.length - 1) {
          menuItems.selectedIndex++
          cm.autocomplete.menu.menuItems = menuItems
        }
        break
    }
  })

  autocomplete.addEventListener('keyup', (evt) => {
    const textLength = autocomplete.innerText.length
    const cursorPosInsideSpan = window.getSelection().getRangeAt(0).endOffset
    if (cursorPosInsideSpan == 0) {
      arrowedOutside('left')
    } else if (cursorPosInsideSpan == textLength) {
      arrowedOutside('right')
    }
  })

  // Capture and handle when mouse clicks outside the TextMarker
  cm.display.sizer.addEventListener('mousedown', (evt) => {
    clickedOutside = true
  })

  autocomplete.addEventListener('focusout', (evt) => {
    if (clickedOutside) {
      onClickedOutside()
    }
  })




  // -------- FUNCTIONS -------- //

  // TODO: User clicks the menu item

  function onEscape() {
    exit(autocomplete.innerText, false, false)
  }

  // Same as Escape.
  function onUndo() {
    exit(autocomplete.innerText, false, false)
  }

  function onClickedOutside() {
    exit(autocomplete.innerText, false, false)
  }

  function arrowedOutside(side) {
    if (side == 'left') {
      exit(autocomplete.innerText, false, true, from.ch)
    } else if (side == 'right') {
      exit(autocomplete.innerText, false, true, from.ch + autocomplete.innerText.length)
    }
  }

  function onEnter() {
    const selectedItemLabel = menuItems.list[menuItems.selectedIndex].label
    switch (selectedItemLabel) {
      case 'Link':
        // Write link
        exit(`${autocomplete.innerText}(url.com)`, true, false)
        break
      case 'Image':
        // Write image
        exit(`!${autocomplete.innerText}(url.com)`, true, false)
        break
      case 'Footnote':
        // Write Footnote
        exit(`^${autocomplete.innerText}`, true, false)
        break
      case 'Citation':
        // Write citation
        exit(`${autocomplete.innerText}`, true, false)
        break
    }
  }

  function exit(replacementText = '', openWizardAfterChanges = false, setCursorPosAfterChanges = false, newCursorPos = undefined) {

    if (openWizardAfterChanges) {

      // Open wizard after the changes
      cm.focusWidgetAfterChanges = {
        from: from,
        to: { line: to.line, ch: from.ch + replacementText.length }
      }

    } else if (setCursorPosAfterChanges) {

      // Set cursor position after the changes.
      // Either 1) manually set it (e.g. to right side, after arrowing out), or 2) maintain it's position after the mark is cleared (e.g. after pressing escape). The later is the default.
      const currentCursorPos = window.getSelection().getRangeAt(0).endOffset
      if (newCursorPos !== undefined) {
        // console.log("Set cursor manually")
        cm.setCursorAfterChanges = {
          line: from.line,
          ch: newCursorPos,
        }
      } else {
        // console.log("Restore cursor position to", from.ch, currentCursorPos)
        cm.setCursorAfterChanges = {
          line: from.line,
          ch: from.ch + currentCursorPos,
        }
      }
    }

    // Set new text string. Doing so also clears the autocomplete TextMarker.
    // Else, manually clear the TextMarker.
    // if (replacementText !== text) {
    //   doc.replaceRange(replacementText, from, to)
    // } else {
    //   mark.clear()
    // }
    doc.replaceRange(replacementText, from, to)

    // Focus CM, otherwise the user must manually click the editor to see the cursor.
    if (setCursorPosAfterChanges) cm.focus()

    // Hide menu
    cm.autocomplete.menu.visible = false
  }


  // -------- MENU -------- //

  // Set initial options
  const menuItems = {
    selectedIndex: 0,
    list: {
      0: {
        label: 'Link',
        preview: '[...](...)',
      },
      1: {
        label: 'Image',
        preview: '![...](...)',
      },
      2: {
        label: 'Footnote',
        preview: '^[...]',
      },
      3: {
        label: 'Citation',
        preview: '[@...]',
      },
      length: 4
    },
  }

  cm.autocomplete.menu.menuItems = menuItems

  // Set position
  const paddingOnLeftSideOfEditor = cm.display.lineSpace.offsetLeft
  cm.autocomplete.menu.element.style.top = `${cm.cursorCoords(true, 'local').bottom}px`
  cm.autocomplete.menu.element.style.left = `${autocomplete.offsetLeft + paddingOnLeftSideOfEditor}px`

  // Show
  cm.autocomplete.menu.visible = true

}
