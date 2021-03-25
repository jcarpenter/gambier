<script>
  import { createEventDispatcher, tick } from 'svelte'
  import { getFromAndTo, writeToDoc } from '../../editor/editor-utils';
  import { getElementAt } from '../../editor/map';

  export let cm
  export let selectedOptionIndex = 0

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

  // Update the items as the user types
  // (usually to narrow the scope).
  // cm.on('beforeChange', (cm, change) => {
  //   if (!isVisible) return
  //   const { from, to, text, origin, update } = change
  //   if (isVisible) {
  //     if (origin == '+input') {
  //       targetTo.ch += text[0].length
  //     } else if (origin == '+delete') {
  //       targetTo.ch = from.ch
  //     }
  //   }
  //   console.log(change)
  //   // filterItems()
  // })

  cm.on('change', (cm, change) => {
    if (!isVisible) return
    const { from, to, text, origin, update } = change
    if (isVisible) {
      if (origin == '+input') {
        targetTo.ch += text[0].length
      } else if (origin == '+delete') {
        targetTo.ch = from.ch
      }
    }
    filterItems()
  })

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
  
  // Close if the cursor has left the brackets
  // cm.on('beforeSelectionChange', (cm, change) => {
  //   if (!isVisible) return
  //   const { ranges, origin, update } = change
  //   const { from, to } = getFromAndTo(ranges[0])

  //   const multipleSelections = ranges.length > 1
  //   const isOutsideLine = from.line !== targetFrom.line
  //   const isOutsideLeftBracket = from.ch < targetFrom.ch
  //   const isOutsideRightBracket = to.ch > targetTo.ch
    
  //   const shouldHide = 
  //     multipleSelections || 
  //     isOutsideLine || 
  //     isOutsideLeftBracket ||
  //     isOutsideRightBracket
    
  //   if (shouldHide) hide()
  // })

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

    if (mode == 'elements') {
      switch (selectedItem.label) {
        case 'Link':
          writeToDoc(cm, `[${selectedText}]()`, line, targetFrom.ch-1, targetTo.ch+1)
          break
        case 'Image':
          writeToDoc(cm, `![${selectedText}]()`, line, targetFrom.ch-1, targetTo.ch+1)
          break
        case 'Footnote':
          writeToDoc(cm, `^[${selectedText}]`, line, targetFrom.ch-1, targetTo.ch+1)
          break
        case 'Citation':
          writeToDoc(cm, `[@${selectedText}]`, line, targetFrom.ch-1, targetTo.ch+1)
          break 
      }

      // Wait for cm to update with changes
      await tick()

      // Select new element
      const newElement = getElementAt(cm, line, targetFrom.ch)

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
    const typedText = cm.getRange(
      { line: targetFrom.line, ch: targetFrom.ch - 2 },
      { line: targetTo.line, ch: targetTo.ch + 1 },
    )
    const textMatchesAnItem = items.some((i) => i.start && typedText.startsWith(i.start))
    if (textMatchesAnItem) {
      items = getStartingItems().filter((i) => {
        return typedText.startsWith(i.start)
      })
    } else {
      items = getStartingItems()
    }
  }

  function getStartingItems() {
    if (mode == 'elements') {
      return [
        { label: 'Link', preview: '[...](...)', start: '' },
        { label: 'Image', preview: '![...](...)', start: '![' },
        { label: 'Footnote', preview: '^[...]', start: '^[' },
        { label: 'Citation', preview: '[@...]', start: '[@' }
      ]
    } else if (mode == 'citation') {
      return [
        { label: 'Johnson and Change, 2012' },
      ]
    }
  }
 
  /**
   * Show the menu
   * @param menuMode - String. 'element', 'citation', etc.
   */
  export function show(menuMode) {

    mode = menuMode
    items = getStartingItems()
    isVisible = true
    selectedIndex = 0
    targetFrom = cm.getCursor('from')
    targetTo = cm.getCursor('to')
    // const { from, to } = getFromAndTo(cm.listSelections()[0])
    // targetFrom = {...from}
    // targetTo = {...to}
    filterItems()
    // Docs: https://codemirror.net/doc/manual.html#charCoords
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
    @include label-normal-small;
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
    background: var(--menuBackgroundColor);
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
      color: var(--selectedMenuItemTextColor);
    }
    .preview {
      color: var(--selectedMenuItemTextColor);
      opacity: 0.7;
    }
  }

  .label {
    color: var(--labelColor);
    flex-grow: 1;
    margin: -1px 0 0 0;
  }

  .preview {
    @include code-typography;
    flex-shrink: 0;
    color: var(--secondaryLabelColor);
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
