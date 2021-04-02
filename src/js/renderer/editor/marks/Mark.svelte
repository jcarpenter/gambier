<script>
  import { tick } from "svelte";

  import { getFromAndTo, writeToDoc } from "../editor-utils";
  import { getElementAt } from "../map";

  export let cm
  export let textMarker = null
  export let type = '' // element.type
  export let classes = [] // element.classes
  
  let el // This dom element
  let isEditable = false // Depends on `type`
  let displayedText = '' // Depends on the span and isEditable
  let isHighlighted = false

  $: textMarker, updateDisplayedText()
  
  /**
   * Get displayed text. 
   * Called on initial setup, once textMarker is set.
   * and whenever `onChanges` handler detects a change
   * has effected textMarker.
   * Ignore non-editable marks.
   */
  export async function updateDisplayedText() {

    if (!textMarker) return
    
    const { from, to } = textMarker.find()
    const element = getElementAt(cm, from.line, from.ch + 1)
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
   * Place cursor at specified position inside
   * the contenteditable `el` span.
   * @param pos
   */
  function setCursorPosition(pos) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(el.childNodes[0], pos);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /**
   * Make alt-arrowing into editable marks behave like 
   * normal text. Is called from keymap actions when
   * alt-left or alt-right is pressed and the previous
   * or next word is a mark.
   * @param fromSide - 'left' or 'right'
   */
  export function altArrowInto(fromSide) {
    let cursorPos = 0
    if (fromSide == 'left') {
      const lastSpace = displayedText.indexOf(' ')
      cursorPos = lastSpace > 0 ? lastSpace : displayedText.length
    } else if (fromSide == 'right') {
      const firstSpace = displayedText.lastIndexOf(' ')
      cursorPos = firstSpace > 0 ? firstSpace + 1 : 0
    }
    setCursorPosition(cursorPos)
    el.focus()
  }

  /**
   * When the doc selection changes (or the cursor moves), a `beforeSelectionChange` listener calls this function on each mark in the doc, and passes in the new selection origin and ranges.
   */
  export function onSelectionChange(origin, ranges) {
    for (const range of ranges) {
      const { from, to } = getFromAndTo(range)
      if (isEditable) checkIfArrowedInto(origin, from, to)
      checkIfInsideSelection(from, to)
    }
  }

  // export function onSelectionChange() {
  //   const selections = cm.listSelections()
  //   for (const range of selections) {
  //     const { from, to } = getFromAndTo(range)
  //     if (isEditable) checkIfArrowedInto(origin, from, to)
  //     checkIfInsideSelection(from, to)
  //   }
  // }


  /**
   * If user arrows into mark, place cursor inside the mark, on the appropriate edge. Sounds obvious, but we have to implement this manually, by checking
   * @param selectionFrom
   * @param selectionTo
   */
  function checkIfArrowedInto(origin, selectionFrom, selectionTo) {

    const { from, to } = textMarker.find()

    // Our criteria for whether to arrow into the mark.
    const keyWasPressed = origin == '+move'
    const markIsNotHighlighted = !isHighlighted
    const isSingleChSelectionOnSameLineAsMark = 
      selectionFrom.line == selectionTo.line && // Single line
      selectionFrom.ch == selectionTo.ch && // Single ch
      selectionFrom.line == from.line // Same line as mark

    // Only proceed if the above are all true. Highlighted is important because when the mark is highlighted, we want the cursor to skip over the mark, instead of entering. By not proceeding, CM handles the arrow without interference, and the cursor skips the mark.
    if (!keyWasPressed || !markIsNotHighlighted || !isSingleChSelectionOnSameLineAsMark) return

    // Set the cursor inside the mark on the correct side.
    // All the weird stuff with `createRange` etc is just part of how
    // setting text selections works with HTML, apparently.
    const enteredLeft = selectionTo.ch == to.ch && selectionTo.sticky == null
    const enteredRight = selectionTo.ch == from.ch && selectionTo.sticky == null
    
    if (!enteredLeft && !enteredRight) return
   
    const placeCursorAt = enteredLeft ? 0 : displayedText.length
    setCursorPosition(placeCursorAt)
    el.focus()
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
   * Called by keymapActions alt-tab handlers.
   */
  export function altTabTo() {
    openWizard()
  }

  /**
   * Open wizard to this mark.
   * First set CM selection to this mark, so wizard opens over it.
   * @param evt
   */
  export function openWizard(suppressWarnings = false) {
    const { from, to } = textMarker.find()
    // Notice we seem to select from end-to-start. With `setSelection`
    // the first value is the anchor, and second is the head. So we're
    // telling CM to place the anchor on the right. We do this so that
    // when alt-tabbing, we skip over the element child spans.
    // console.log(from, to)
    cm.setSelection(from, to)
    isHighlighted = true
    cm.wizard.show(textMarker, suppressWarnings)
  }


  // --------- EDITABLE MARK FUNCTIONS --------- //

  /**
   * Open url on command click (if there is a url)
   */
  function onClick(evt) {
    if (evt.metaKey && type.includes('link')) {
      const { from, to } = textMarker.find()
      const element = getElementAt(cm, from.line, from.ch + 1)
      const url = element.spans.find((s) => s.type.includes('url'))
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
          if (!wordsRemain) setCursorPosition(displayedText.length)
  
        } else if (atRightEdge) {
  
          // Arrow out right side of the mar
          cm.focus()
          cm.setCursor(to.line, to.ch)

        }
        
        break
      }

      case 'ArrowUp':
        // evt.preventDefault()
        // cm.focus()
        cm.triggerOnKeyDown({ type: 'keydown', keyCode: 38, altKey: evt.altKey, shiftKey: false,})
        break
      case 'ArrowDown':
        // evt.preventDefault()
        // cm.focus()
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
</script>

<style type="text/scss"></style>

<svelte:options accessors={true}/>

{#if isEditable}
  <span
    contenteditable
    tabindex="0"
    bind:this={el}
    class={`mark editable ${classes.join(' ')}`}
    class:highlighted={isHighlighted}
    bind:textContent={displayedText}
    on:mousedown={selectMark}
    on:keydown={onKeyDown}
    on:click={onClick}
    on:dblclick={() => openWizard()}
    on:input={writeChanges}
  />
{:else}
  <span
    tabindex="0"
    bind:this={el}
    class={`mark ${classes.join(' ')}`}
    class:highlighted={isHighlighted}
    on:mousedown={selectMark}
    on:dblclick={openWizard}
  />
{/if}

<!-- 
on:input={(evt) => writeToDoc(cm, evt.target.textContent, line, text.start, text.end) }

on:dblclick={onDoubleClick}
on:focus={onFocus}
on:focusout={onFocusout} 
-->
