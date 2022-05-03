<script lang='js'>
  import { Pos } from "codemirror";
  import { tick } from "svelte";
  import { setCaretPositionByIndex } from "../../shared/utils";
  import ImagePreview from "../component/main/wizard/ImagePreview.svelte";
  import * as WizardManager from "../WizardManager";
  import { getFromAndTo, pasteAsPlainText, writeToDoc } from "./editor-utils";
  import { getDocElements, getElementAt, getLineElements } from "./map";

  export let cm
  export let textMarker = null
  export let type = '' // element.type
  export let classes = [] // element.classes
  
  let element // This line element (per getLineElements)
  let el // This dom element
  let isEditable = false // Depends on `type`
  let displayedText = '' // Depends on the span and isEditable
  let isHighlighted = false

  $: textMarker, update()
  
  /**
   * Get displayed text (and url, if it's a figure)
   * Called on initial setup, once textMarker is set,
   * and whenever `onChanges` handler detects a change
   * has effected textMarker.
   * Ignore non-editable marks.
   */
  export async function update() {

    if (!textMarker) return
    
    // Get element at the TextMarker
    const { from, to } = textMarker.find()    
    const lineElements = getLineElements(cm, from.line)
    element = lineElements.find((e) => e.start == from.ch && e.end == to.ch)
    isEditable = element?.mark.isEditable

    if (!isEditable) return

    // Only update displayedText if there's a new value.
    // Else, if it's blank (missing), display a empty string.
    const newDisplayedText = element.spans.find((c) => c.type.includes(element.mark.displayedSpanName))?.string
    if (displayedText !== newDisplayedText) {
      displayedText = newDisplayedText
    } else if (!newDisplayedText) {
      displayedText = ''
    }

    // Wait for state changes to apply to DOM,
    // then call changed() on the textMarker.
    // This tells CodeMirror that a resize has happened,
    // which is critical for correct cursor positioning.
    await tick()
    textMarker.changed()
    
  }


  // --------- MANAGE SELECTIONS --------- //

  /**
   * Make alt-arrowing into editable marks behave like 
   * normal text. Is called from keymap actions when
   * alt-left or alt-right is pressed and the previous
   * or next word is a mark.
   * @param fromSide - 'left' or 'right'
   */
  export function altArrowInto(fromSide) {
    let caretIndex = 0
    if (fromSide == 'left') {
      const lastSpace = displayedText.indexOf(' ')
      caretIndex = lastSpace > 0 ? lastSpace : displayedText.length
    } else if (fromSide == 'right') {
      const firstSpace = displayedText.lastIndexOf(' ')
      caretIndex = firstSpace > 0 ? firstSpace + 1 : 0
    }
    setCaretPositionByIndex(el, caretIndex)
    el.focus()
  }

  /**
   * When the doc selection changes (or the cursor moves), a 
   * `beforeSelectionChange` listener calls this function on each mark 
   * in the doc, and passes in the new selection origin and ranges.
   */
  export function onSelectionChange(origin, ranges) {
    for (const range of ranges) {
      const { from, to } = getFromAndTo(range)
      if (isEditable) checkIfArrowedInto(origin, from, to)
      checkIfInsideSelection(from, to)
    }
  }

  /**
   * If user arrows into mark, place cursor inside the mark, at the right spot.
   * Sounds obvious, but we have to implement this manually.
   * @param selectionFrom
   * @param selectionTo
   */
  async function checkIfArrowedInto(origin, selectionFrom, selectionTo) {

    const { from, to } = textMarker.find()
    const cursor = cm.getCursor()

    // Our criteria for whether to arrow into the mark.
    const keyWasPressed = origin == '+move'
    const markIsNotHighlighted = !isHighlighted
    const isSingleChSelectionOnSameLineAsMark = 
      selectionFrom.line == selectionTo.line && // Single line
      selectionFrom.ch == selectionTo.ch && // Single ch
      selectionFrom.line == from.line // Same line as mark

    // Only proceed if the above are all true. Highlighted is important 
    // because when the mark is highlighted, we want the cursor to skip 
    // over the mark, instead of entering. By not proceeding, CM 
    // handles the arrow without interference, and the cursor skips the mark.
    if (!keyWasPressed || !markIsNotHighlighted || !isSingleChSelectionOnSameLineAsMark) return

    // Set the cursor inside the mark on the correct side.
    // const enteredLeft = selectionTo.ch == to.ch && selectionTo.sticky == null
    // const enteredRight = selectionTo.ch == from.ch && selectionTo.sticky == null
   
    const arrowedInFromLeft = selectionTo.ch == to.ch && cursor.ch == from.ch
    const arrowedInFromRight = selectionTo.ch == from.ch && cursor.ch == to.ch
    const arrowedInFromAbove = selectionTo.ch == to.ch && cm.findPosV(cursor, 1, 'line').ch == to.ch
    const arrowedInFromBelow = selectionTo.ch == to.ch && cm.findPosV(cursor, -1, 'line').ch == to.ch

    if (arrowedInFromAbove || arrowedInFromBelow) {

      // We set the caret position inside the contenteditable 
      // based on the pixel coordinates of the cursor before
      // it was arrowed up or down into the Mark.
      // We use caretRangeFromPoint API for this: 
      // `https://developer.mozilla.org/en-US/docs/Web/API/Document/caretRangeFromPoint`

      // Get previous (pre-arrow-move) cursor coordinates
      // We're lucky that calling this method and getCursor from
      // `beforeSelectionChange` gets us pre-change values
      // (as the name implies).
      const { left, top, bottom } = cm.cursorCoords(true, 'window')

      const range = arrowedInFromAbove ?
        document.caretRangeFromPoint(left, bottom + 5) :
        document.caretRangeFromPoint(left, top - 5)

      const sel = window.getSelection()
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)

    } else if (arrowedInFromLeft || arrowedInFromRight) {

      // const charAt = cm.getRange(selectionFrom, Pos(selectionTo.line, selectionTo.ch+1))
      const caretIndex = arrowedInFromLeft ? 0 : displayedText.length
      setCaretPositionByIndex(el, caretIndex)
      el.focus()

    }   
  }

  /**
   * If mark is inside a text selection, highlight it. 
   * Else, make sure it's not highlighted.
   * @param selectionFrom
   * @param selectionTo
   */
  function checkIfInsideSelection(selectionFrom, selectionTo) {
    
    const { from, to } = textMarker.find()
    const isMultiLineSelection = selectionFrom.line !== selectionTo.line
    const isMultiChSelectionOnSameLineAsMark = 
      selectionFrom.line == selectionTo.line &&
      selectionFrom.ch !== selectionTo.ch
      selectionFrom.line == from.line

    if (isMultiLineSelection) {
      var isInside = 
        (selectionFrom.line == from.line && selectionFrom.ch <= from.ch) ||
        (selectionFrom.line < from.line && from.line < selectionTo.line) ||
        (selectionTo.line == from.line && selectionTo.ch >= to.ch)
    } else if (isMultiChSelectionOnSameLineAsMark) {
      var isInside =
        from.line == selectionFrom.line &&
        selectionFrom.ch <= from.ch && to.ch <= selectionTo.ch
    } else {
      var isInside = false
    }

    isHighlighted = isInside
  }

  /**
   * Set selection of CM instance.
   * If editable, place cursor at start of mark/element.
   * If NOT editable, select the entire mark/element
   * @param evt
   */
  function selectMark(evt) {
    const { from, to } = textMarker.find()
    // Clear existing editor text selection, otherwise it will remain visible while the cursor is inside the contenteditable.
    if (isEditable) {
      cm.setCursor(to.line, to.ch)
    } else {
      cm.setSelection(from, to)
    }
  }


  /**
   * Select the mark's text in the editor.
   * And if it has a wizard, open the wizard to it.
   * Called by keymapActions alt-tab handlers.
   */
  export function altTabTo() {
    selectMark()
    if (element.mark.hasWizard) {
      WizardManager.store.setTarget({
        cm, 
        panelId: cm.panel.id, 
        domElement: el,
        element,
        openedBy: { tabOrClick: true, hover: false, metaKey: false, altKey: false }
      })
    }
    isHighlighted = true
  }

  


  // --------- EDITABLE MARK FUNCTIONS --------- //

  /**
   * Open url on command click (if there is a url)
   */
  function onClick(evt) {
    if (evt.metaKey && type.includes('link')) {
      const { from, to } = textMarker.find()
      const element = getElementAt(cm, from.line, from.ch + 1)
      const url = element.spans.find(({type}) => type.includes('url'))
      if (url?.string) {
        window.api.send('openUrlInDefaultBrowser', url.string)
      } else {
        // TODO: Handle missing url?
        // Mark should be visibly "incomplete", so maybe we
        // just do nothing on click. And/or don't style with 
        // cursor: pointer. 
      }
    }
  }
  
  function onKeyDown(evt) {

    // On key down, check if we should show wizard. This will
    // E.g. If user presses alt, we probably want to show wizard 
    // (specifics vary based on element type, keys held down, etc.
    if (!WizardManager.isWizardOpen) {
      WizardManager.onKeyDownCheckIfWeShouldOpenWizard(cm, evt)
    }
    
    const { from, to } = textMarker.find()

    switch (evt.key) {

      case 'Backspace':
      case 'Delete': {
        if (isHighlighted) {
          cm.replaceRange('', from, to)
          cm.focus()
        }
        break
      }

      case 'ArrowLeft': {

        if (evt.metaKey) {

          // Cmd-Left: send cursor to start of line
          cm.setCursor(from.line, 0)
          cm.focus()

        } else {

          const cursorCh = window.getSelection().anchorOffset
          const atLeftEdge = cursorCh == 0
          if (atLeftEdge) {
            cm.setCursor(from.line, from.ch)
            cm.focus()
            if (evt.altKey) {
              // If alt key is pressed, trigger a second alt-left in CodeMirror, 
              // to correctly reproduce expected behaviour (cursor jumps to 
              // beginning of previous word.)
              cm.triggerOnKeyDown({
                type: 'keydown',
                keyCode: 37,
                altKey: true,
                shiftKey: false,
              })
            }
          }
        }

        break
      }

      case 'ArrowRight': {

        const cursorCh = window.getSelection().anchorOffset
        const atRightEdge = cursorCh == displayedText.length
  
        if (evt.metaKey) {
  
          // Send cursor to end of line
          const lineLength = cm.getLine(from.line).length
          cm.setCursor(from.line, lineLength)
          cm.focus()
  
        } else if (evt.altKey && atRightEdge) {
          
          // If alt key, trigger a second alt-right in CodeMirror 
          // to correctly reproduce expected behaviour (cursor jumps to 
          // end of next word.)
          cm.setCursor(to.line, to.ch)
          cm.triggerOnKeyDown({ type: 'keydown', keyCode: 39, altKey: true })
  
        } else if (evt.altKey) {
  
          // Else, if !altKey, check if next alt-right will place
          // cursor at end of mark. If yes, set position manually.
          // For some reason this doesn't happen automatically.
          const endOfNextWord = displayedText.slice(cursorCh).search(/\S[\s|]|\)]/)
          const wordsRemain = endOfNextWord !== -1
          if (!wordsRemain) setCaretPositionByIndex(el, displayedText.length)
  
        } else if (atRightEdge) {
  
          // Arrow out right side of the mar
          cm.focus()
          cm.setCursor(to.line, to.ch)

        }
        
        break
      }

      case 'ArrowUp':
        evt.preventDefault()
        cm.focus()
        cm.triggerOnKeyDown({ type: 'keydown', keyCode: 38, altKey: evt.altKey, shiftKey: false,})
        break
      case 'ArrowDown':
        evt.preventDefault()
        cm.focus()
        cm.triggerOnKeyDown({ type: 'keydown', keyCode: 40, altKey: evt.altKey, shiftKey: false,})
        break
      case 'Tab':
        evt.preventDefault()
        if (evt.altKey) {
          // Forward alt-tab events to `cm` by using undocumented `cm.triggerOnKeyDown` function. Per https://discuss.codemirror.net/t/signal-keydown/548/2. This ensures that alt-tab events work consistently, from user-pov, regardless of what element is focused (cm or widget).
          cm.triggerOnKeyDown({ type: 'keydown', keyCode: 9, altKey: true, shiftKey: evt.shiftKey })
        }
        break
    }
  }

  /**
   * Write changes to the document.
   */
  function writeChanges(evt) {

    const { from } = textMarker.find()
    const element = getElementAt(cm, from.line, from.ch + 1)
    
    // Find the start and end of the correct span to write to
    const { start, end } = element.spans.find((s) => s.type.includes(element.mark.displayedSpanName))
    
    // Write changes
    writeToDoc(cm, evt.target.textContent, element.line, start, end)
    
    // Tell CodeMirror that TextMarker changed size
    textMarker.changed()
  }


  // --------- FIGURES --------- //

  /** 
   * Open this image (if the mark represents an image or figure)
   * in the Lightbox. Pass the lightbox a list of all the images 
   * in the current doc (so we can go through them), and the
   * index of this one.
   */
  function openImageInLightbox() {

    let images = getDocElements(cm, 'image')

    // Find index of this image among all images in the doc.
    const indexOfThisImage = images.findIndex((i) => 
      i.line == element.line &&
      i.start == element.start &&
      i.end == element.end
    )

    // Create array of objects formatted to the needs of
    // `OPEN_LIGHTBOX`. Each with url, title, etc.
    images = images.map((i) => {
      return {
        url: i.spans.find(({type}) => type.includes('url'))?.string,
        text: i.spans.find(({type}) => type.includes('text'))?.string,
        title: i.spans.find(({type}) => type.includes('title'))?.string,
        // cmInstance: cm
      }
    })

    // Filter images missing urls
    images = images.filter((i) => i.url)

    // Send to store
    window.api.send('dispatch', {
      type: 'OPEN_LIGHTBOX',
      selectedIndex: indexOfThisImage,
      images,
    })
  }

</script>

<style lang="scss"></style>

<svelte:options accessors={true}/>

{#if isEditable && type.includes('figure')}

  <!-- FIGURE -->

  <div class:highlighted={isHighlighted}>
    <span 
      class="thumb"
      bind:this={el}
    >
      <ImagePreview 
        userSpecifiedUrl={element.spans.find(({type}) => type.includes('url'))?.string}
        {cm}
        {element}
      />
    </span>
    <span
      contenteditable
      spellcheck="false"
      tabindex="0"
      class={`caption mark editable ${classes.join(' ')}`}
      class:highlighted={isHighlighted}
      class:blank={displayedText == ''}
      bind:textContent={displayedText}
      on:mousedown={selectMark}
      on:keydown={onKeyDown}
      on:click={onClick}
      on:input={writeChanges}
      on:paste={pasteAsPlainText}
      on:scroll|preventDefault
    />
  </div>

{:else if isEditable}

  <!-- EDITABLE (e.g. link) -->

  <span
    contenteditable
    spellcheck="false"
    tabindex="0"
    bind:this={el}
    class={`mark editable ${classes.join(' ')}`}
    class:highlighted={isHighlighted}
    bind:textContent={displayedText}
    on:mousedown={selectMark}
    on:keydown={onKeyDown}
    on:click={onClick}
    on:dblclick={() => {
      
      // TODO: We could trigger wizard from double click. 
      // Pros: Discoverability of editing.
      // Cons: Inconsistent text-editing IXD.
      
      // WizardManager.store.setTarget({
      //   cm, 
      //   panelId: cm.panel.id, 
      //   domElement: el,
      //   element,
      //   openedBy: { tabOrClick: false, hover: true, metaKey: false, altKey: true }
      // })
      // selectMark()
      // isHighlighted = true
    }}
    on:input={writeChanges}
    on:paste={pasteAsPlainText}
    on:focus={(evt) => {

    // As soon as user starts editing an editable mark,
    // stop the timer that triggers showing wizard (if it's active).
    // E.g. User clicks mouse inside mark with intent to type.
    // We don't want wizard to appear while they're typing.
    // So we cancel the timer.
    // if (WizardManager.isTimerActive) {
    //   WizardManager.store.cancelTimer()
    // }

      // If wizard is open, close it when user
      // focuses mark (whether by clicking, arrowing into, etc)
      if (WizardManager.isWizardOpen) WizardManager.store.close()
    }}

  />

{:else if !isEditable && type == 'task'}

  <!-- TASK LIST ITEM -->
  
  <button 
    tabindex="0"
    bind:this={el}
    class={`mark task`}
    class:highlighted={isHighlighted}
    class:closed={element?.markdown.includes('x')}
    on:click={() => {
      const isClosed = element?.markdown.includes('x')
      const { line, start, end } = element
      cm.replaceRange(
        isClosed ? ' ' : 'x', 
        Pos(line, start + 3),
        Pos(line, start + 4)
      )
    }}
  />

{:else if !isEditable}

  <!-- NON-EDITABLE (e.g. image, footnote, citation) -->

  <span
    tabindex="0"
    bind:this={el}
    class={`mark ${classes.join(' ')}`}
    class:highlighted={isHighlighted}
    on:mousedown={selectMark}
    on:dblclick={() => {
      WizardManager.store.setTarget({
        cm, 
        panelId: cm.panel.id, 
        domElement: el,
        element,
        openedBy: { tabOrClick: true, hover: false, metaKey: false, altKey: false }
      })
      selectMark()
      isHighlighted = true
    }}
  />

{/if}


<!--
Unused, but keeping in case I want to use later:
on:dblclick={() => openWizard()}
on:input={(evt) => writeToDoc(cm, evt.target.textContent, line, text.start, text.end) }
on:dblclick={onDoubleClick}
on:focus={onFocus}
on:focusout={onFocusout} 
-->
