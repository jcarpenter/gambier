<script>
  import { createEventDispatcher, tick } from 'svelte'
  import { getCharAt, getFromAndTo, writeToDoc } from '../../editor/editor-utils';
  import { getElementAt } from '../../editor/map';
  import { markElement } from '../../editor/mark';
  import { isWindowFocused } from '../../StateManager';

  export let cm
  // export let selectedOptionIndex = 0

  let isVisible = false
  let leftPos = '-5000px' // Default value
  let topPos = '0px'
  let targetFrom
  let targetTo
  let selectedIndex = 0
  let items = []
  let mode = '' // 'element', 'citation', etc.
  let typedText = ''

  // Close the wizard when this CM instance is de-focused.
  // E.g. When other panel is selected, or user clicks on sidebar.
  cm.on('blur', (cm, evt) => {
    if (isVisible) hide()
  })

  // Arrow up/down: cycle through the options
  // Enter: select item and close
  // Esc: close
  cm.on('keydown', (cm, evt) => {
    if (isVisible && !evt.metaKey) {
      switch (evt.key) {
        case 'ArrowUp':
          evt.preventDefault()
          if (selectedIndex > 0) selectedIndex--
          break
        case 'ArrowDown':
          evt.preventDefault()
          if (selectedIndex < items.length - 1) selectedIndex++
          break
        case 'Enter':
          selectItem()
          evt.preventDefault()
          break
        case 'Escape':
          evt.preventDefault()
          hide()
          break
      }
    }
  })

  // When user types, update items and position.
  cm.on('change', (cm, change) => {
    if (!isVisible) return
    const { from, to, text, origin, update } = change
    if (origin == '+input') {
      targetTo.ch += text[0].length
      // console.log(targetTo)
    } else if (origin == '+delete') {
      targetTo.ch = from.ch
    }
    filterItems()
    setPosition()
  })

  // Hide autocomplete when cursor moves outside the brackets
  cm.on('cursorActivity', (cm) => {
    if (!isVisible) return
    const from = cm.getCursor('from')
    const to = cm.getCursor('to')

    const isOutsideLine = from.line !== targetFrom.line
    const isOutsideLeftBracket = from.ch < targetFrom.ch
    const isOutsideRightBracket = to.ch > targetTo.ch

    const shouldHide = 
      isOutsideLine || 
      isOutsideLeftBracket ||
      isOutsideRightBracket
    
    if (shouldHide) hide()

  })
  
  /**
   * Write to doc. 
   * What is written depends on the mode and the item selected.
   */
  async function selectItem() {

    const selectedItem = items[selectedIndex]
    const selectedText = cm.getRange(targetFrom, targetTo)
    const noTextIsSelected = 
      targetFrom.line == targetTo.line &&
      targetFrom.ch == targetTo.ch
    const line = targetFrom.line

    // Determine write start and end points:
    // If precedingChar matches, write one character earlier,
    // so we overwrite that preceding character. 
    // Or else we'll get duplicates, ala: `!![text](url)`
    const precedingChar = getCharAt(cm, targetFrom.line, targetFrom.ch-2)
    let writeFromCh = precedingChar == items[selectedIndex].precedingChar ?
      targetFrom.ch - 2 :
      targetFrom.ch - 1
    // Fix edge case 
    if (writeFromCh < 0) writeFromCh = 0
    const writeToCh = targetTo.ch + 1
        
    // Determine string to write
    let string = ''
    if (mode == 'elements') {
      switch (selectedItem.label) {
        case 'Link': string = `[${selectedText}]()`; break
        case 'Image': string = `![${selectedText}]()`; break
        case 'Footnote': string = `^[${selectedText}]`; break
        case 'Citation': string = `[${selectedText}]`; break
      }
    }
    
    // Save the cursor position so we can restore it
    // after writing the chanes. This is important when 
    // we're in sourceMode. We don't want the cursor to
    // suddenly jump away from the user.
    const cursorPos = {...cm.getCursor('to')}

    // Write the string
    writeToDoc(cm, string, line, writeFromCh, writeToCh)

    // Restore the cursor position (see why above).
    cm.setCursor(cursorPos)

    // Hide the autocomplete menu
    hide()

    // Create mark if we're not in sourceMode
    // and the new element isMarkable
    if (!window.state.sourceMode) {

      // Wait for cm to update with changes
      await tick()
      
      // If element was created, and is markable
      // manually create the mark. This normally would
      // happen automatically in onChanges, but won't
      // because cursor is inside

      const newEl = getElementAt(cm, line, writeFromCh + 1) 
      const newElIsMarkable = newEl.mark.isMarkable
      if (newElIsMarkable) {
        const mark = markElement(cm, newEl)
        mark.component.openWizard(true)
      }
    }


    // Place cursor at same position it was before the change
    // If there was a selection, place it on right side

    // cm.setSelection({ line, ch: 2 }, { line, ch: 2 }) 
    return
    
    if (mode == 'elements') {

      // Set cursor position. 
      if (selectedItem.label.equalsAny('Link')) {
        const { line, text, url } = newElement
        if (newElement.text.string == '') {
          // If text is empty, place inside brackets, ready to enter text. 
          // [|]()
          cm.setSelection({ line, ch: text.start }, { line, ch: text.end })
        } else {
          // Else place inside parentheses, ready to enter URL. 
          // [text](|)
          cm.setSelection({ line, ch: url.start }, { line, ch: url.end })
        }
      } else if (selectedItem.label == 'Image') {
        // Place inside parentheses, ready to enter URL. 
        // ![](|)
        const { line, url } = newElement
        cm.setSelection({ line, ch: url.start }, { line, ch: url.end })
      } else if (selectedItem.label == 'Footnote') {
        const { line, content } = newElement
        if (content.string == '') {
          // If content is empty, place inside brackets, ready to enter text. 
          // ^[|]
          cm.setSelection({ line, ch: content.start }, { line, ch: content.start })
        } else {
          // Else place at end of brackets, ready to continue.
          cm.setSelection({ line, ch: content.end }, { line, ch: content.end })
        }
      }
      
      // Open the wizard to the new element
      if (!window.state.sourceMode) {
        // newElement.isNew = true
        const textMarker = cm.findMarksAt({ line, ch: newElement.start + 1})[0]
        textMarker.component.openWizard()
      }

      // tabToNextMark(cm)
    }

    hide()
  }

  /**
   * Filter items based on what user has typed.
   * Get string encapsulating brackets, contents, and preceding 1 character.
   * Run narrowScope() as the user types. If the string matches any of the items,
   * narrow to show only those items.
   * If there are no matches, show all items
   */
  function filterItems() {

    // Get text typed so far, plus surrounding characters.
    const typedText = cm.getRange(
      { line: targetFrom.line, ch: targetFrom.ch - 1 },
      { line: targetTo.line, ch: targetTo.ch + 1 },
    )

    const precedingChar = getCharAt(cm, targetFrom.line, targetFrom.ch-2)
    
    // Check if any items match the preceding character
    const anItemMatchesPrecedingChar = 
      precedingChar !== '' && 
      items.some((i) => i.precedingChar == precedingChar)

    // If yes, filter to those items that match the preceding char
    if (anItemMatchesPrecedingChar) {
      items = getStartingItems().filter((i) => {
        return i.precedingChar == precedingChar
      })
      return
    } 
    
    // Else, show all items
    items = getStartingItems()
  }

  function getStartingItems() {
    if (mode == 'elements') {
      return [
        { label: 'Link', preview: '[...](...)', precedingChar: '', start: '' },
        { label: 'Image', preview: '![...](...)', precedingChar: '!', start: '![' },
        { label: 'Footnote', preview: '^[...]', precedingChar: '^', start: '^[' },
        { label: 'Citation', preview: '[@...]', precedingChar: '', start: '[@' }
      ]
    } else if (mode == 'citation') {
      return [
        { label: 'Johnson and Change, 2012' },
      ]
    }
  }
 
  /**
   * Show the menu. 
   * @param menuMode - String. 'element', 'citation', etc.
   */
  export function show(menuMode) {
    mode = menuMode
    items = getStartingItems()
    isVisible = true
    selectedIndex = 0
    targetFrom = {...cm.getCursor('from')}
    targetTo = {...cm.getCursor('to')}
    filterItems()
    setPosition()
  }

  /**
   * Set absolute position values of the autocomplete element.
   * This is called on initial show, and then every time the 
   * user types while isVisible is true
   * Docs: https://codemirror.net/doc/manual.html#cursorCoords
   */
  function setPosition() {
    if (!isVisible) return
    const paddingOnLeftSideOfEditor = cm.display.lineSpace.offsetLeft
    leftPos = `${cm.cursorCoords(true, 'local').left + paddingOnLeftSideOfEditor}px`
    topPos = `${cm.cursorCoords(true, 'local').bottom + 14}px`
  }

  /**
   * Hide the menu
   */
  function hide() {
    isVisible = false
    targetFrom = null
    targetTo = null
    leftPos = '-5000px'
    topPos = '0px'
  }

</script>

<style type="text/scss">
  ul {
    @include system-small-font;
    backdrop-filter: blur(8px);
    position: fixed;
    user-select: none;
    z-index: 100;
    overflow: hidden;
    position: absolute;
    border-radius: 2.5px;
    list-style: none;
    margin: 0;
    width: 200px;
    padding: 0;
    background: var(--menu-background);
    @include dark { 
      border: 1px solid white(0.2);
      box-shadow:
        0 0 0 0.5px black(1);
    }
    @include light { 
      box-shadow: 
        inset 0 0.5px 0 0 white(0.5), // Top bevel
        0 0 0 0.5px black(0.12), // Outline
        0 5px 16px 0 black(0.2); // Drop shadow
    }
  }

  li {
    margin: 0;
    height: 20px;
    padding: 0 5px;
    display: flex;
    cursor: default;
    white-space: nowrap;
    outline: none;
    align-items: center;
    user-select: none;
  }

  li.selected {
    background-color: var(--controlAccentColor);
    .label {
      color: var(--selected-menuitem-text-color);
    }
    .preview {
      color: var(--selected-menuitem-text-color);
      opacity: 0.7;
    }
  }

  .label {
    color: var(--label-color);
    flex-grow: 1;
    margin: -1px 0 0 0;
  }

  .preview {
    @include code-typography;
    flex-shrink: 0;
    color: var(--secondary-label-color);
  }
</style>

<svelte:options accessors={true} />

<ul
  class:isVisible
  class="autocomplete"
  style="left:{leftPos}; top:{topPos};"
  tabindex="0"
>
  {#each items as { label, preview }, index}
    <li 
      class:selected={index == selectedIndex}
      on:mouseenter={() => selectedIndex = index}
      on:mousedown|preventDefault
      on:mouseup={selectItem}
    >
      <span class="label">{label}</span>
      {#if preview} 
        <span class="preview">{preview}</span>
      {/if}
    </li>
  {/each}
</ul>
