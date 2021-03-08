<script>
  import { getFromAndTo, writeToDoc } from "../editor-utils";

  export let cm
  export let element
  export let highlighted = false

  let el
  let isEditable = false
  let displayedText = ''

  $: element, getDisplayedText()

  // Get text that mark displays. If the mark is editable,
  // this is a string of one of the child elements, e.g.
  // `content`, or `text.
  function getDisplayedText() {
    if (!element) return
    isEditable = element.type.includesAny('link', 'url-in-brackets')

    if (isEditable) {
      if (element.type.includesAny('collapsed', 'shortcut')) {
        displayedText = element.label.string
      } else if (element.type == 'url-in-brackets') {
        displayedText = element.url.string
      } else {
        displayedText = element.text.string
      }
    }
  }


  // --------- MANAGE SELECTIONS --------- //

  /**
   * When the doc selection changes (or the cursor moves), a `beforeSelectionChange` listener calls this function on each mark in the doc, and passes in the new selection origin and ranges.
   */
  export function onSelectionChange(origin, ranges) {
    for (const r of ranges) {
      const { from, to } = getFromAndTo(r)
      if (isEditable) checkIfArrowedInto(origin, from, to)
      checkIfInsideSelection(from, to)
    }
  }

  /**
   * If user arrows into mark, place cursor inside the mark, on the appropriate edge. Sounds obvious, but we have to implement this manually, by checking
   * @param from
   * @param to
   */
  function checkIfArrowedInto(origin, from, to) {

    const { line, start, end } = element

    // Our criteria for whether to arrow into the mark.
    const keyWasPressed = origin == '+move'
    const markIsNotHighlighted = !highlighted
    const isSingleChSelectionOnSameLineAsMark = 
      from.line == to.line && // Single line
      from.ch == to.ch && // Single ch
      from.line == line // Same line as mark

    // Only proceed if the above are all true. Highlighted is important because when the mark is highlighted, we want the cursor to skip over the mark, instead of entering. By not proceeding, CM handles the arrow without interference, and the cursor skips the mark.
    if (!keyWasPressed || !markIsNotHighlighted || !isSingleChSelectionOnSameLineAsMark) return

    // Set the cursor inside the mark on the correct side.
    // All the weird stuff with `createRange` etc is just part of how
    // setting text selections works with HTML, apparently.
    const enteredLeft = to.ch == end && to.sticky == null
    const enteredRight = to.ch == start && to.sticky == null
    if (!enteredLeft && !enteredRight) return
    const placeCursorAt = enteredLeft ? 0 : displayedText.length
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(el.childNodes[0], placeCursorAt);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    el.focus()
  }

  /**
   * If mark is inside a text selection, highlight it. 
   * Else, make sure it's not highlighted.
   * @param from
   * @param to
   */
  function checkIfInsideSelection(from, to) {

    const { line, start, end } = element

    const isMultiLineSelection = from.line !== to.line
    const isMultiChSelectionOnSameLineAsMark = 
      from.line == to.line &&
      from.ch !== to.ch
      from.line == line

    if (isMultiLineSelection) {
      var isInside = 
        (from.line == line && from.ch <= start) ||
        (from.line < line && line < to.line) ||
        (to.line == line && to.ch >= end)
    } else if (isMultiChSelectionOnSameLineAsMark) {
      var isInside =
        line == from.line &&
        from.ch <= start && end <= to.ch
    } else {
      var isInside = false
    }

    highlighted = isInside
  }

  function selectMark(evt) {
    const { line, start, end } = element
    // Clear existing editor text selection, otherwise it will remain visible while the cursor is inside the contenteditable.
    if (isEditable) {
      cm.setCursor(element.line, element.start)
    } else {
      cm.setSelection({line, ch: start}, {line, ch: end})
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
  export function openWizard() {
    const { line, start, end } = element
    // Notice we seem to select from end-to-start. With `setSelection`
    // the first value is the anchor, and second is the head. So we're
    // telling CM to place the anchor on the right. We do this so that
    // when alt-tabbing, we skip over the element child spans.
    cm.setSelection({ line, ch: end }, { line, ch: start })
    highlighted = true
    cm.wizard.show(element)
  }


  // --------- EDITABLE MARK FUNCTIONS --------- //
  
  function onKeyDown(evt) {
    
    const { line, start, end } = element
    
    switch (evt.key) {
      case 'Backspace':
      case 'Delete':
        cm.replaceRange('', { line, ch: start }, { line, ch: end })
        cm.focus()
        break
      case 'ArrowLeft':
        const atLeftEdge = window.getSelection().getRangeAt(0).endOffset == 0
        if (atLeftEdge) {
          cm.setCursor(line, start)
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
        break
      case 'ArrowRight':
        const atRightEdge = window.getSelection().getRangeAt(0).endOffset == el.innerText.length
        if (atRightEdge) {
          cm.setCursor(line, end)
          cm.focus()
          // If alt key is pressed, trigger a second alt-right in CodeMirror, 
          // to correctly reproduce expected behaviour (cursor jumps to 
          // end of next word.)
          if (evt.altKey) {
            cm.triggerOnKeyDown({
              type: 'keydown',
              keyCode: 39,
              altKey: true,
              shiftKey: false,
            })
          }
        }
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
</script>

<style type="text/scss"></style>

<svelte:options accessors={true}/>

{#if element.type.equalsAny('url-in-brackets')}
  <span
    contenteditable
    tabindex="0"
    bind:this={el}
    class={`mark editable ${element.classes.join(' ')}`}
    class:highlighted
    bind:textContent={element.url.string}
    on:mousedown={selectMark}
    on:keydown={onKeyDown}
    on:dblclick={openWizard}
  />
{:else if isEditable}
  <span
    contenteditable
    tabindex="0"
    bind:this={el}
    class={`mark editable ${element.classes.join(' ')}`}
    class:highlighted
    bind:textContent={displayedText}
    on:mousedown={selectMark}
    on:keydown={onKeyDown}
    on:dblclick={openWizard}
  />
{:else}
  <span
    tabindex="0"
    bind:this={el}
    class={`mark ${element.classes.join(' ')}`}
    class:highlighted
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
