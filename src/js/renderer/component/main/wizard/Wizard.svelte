<script>
  import { onMount, tick } from 'svelte'
  import { getCharAt } from '../../../editor/editor-utils'
  import FootnoteInline from './FootnoteInline.svelte'
  import Link from './Link.svelte'

  export let cm = null
  export let target = null // An inlineElement
  export let element = null // DOM element, set with bind:this
  export let editorState = {}

  let isVisible = false
  let isError = false
  let leftPos = '-5000px' // Default value
  let topPos = '0px'

  // Setup event listeners once `cm` is populated.
  $: {
    if (cm !== null) {
      cm.on('editorStateChanged', onEditorStateChange)
    }
  }

  // ------- EVENT HANDLERS ------ //

  /*
  Wizard changes write immediately, per keystroke. On every input, `replaceRanges` writes the change`. This triggers the `onChanges` function in Editor.svelte. We: save changes object to `editorWidget.lastChanges` via `cm.setEditorState(...)` and fire `editorStateChanged` event. Wizard gets event and changes. If it’s open, if checks if the span it’s editing is affected. If yes, it gets the new inline element, and sets it as target.
  */

  /**
   * Respond to editorState changes. Update visibility, position, target object, etc.
   */
  function onEditorStateChange(changes) {
    if (changes.includes('widget') && changes.includes('selected')) {
      // Show/Hide wizard, based on `editorState.widget.target`
      if (editorState.widget.selected !== null) {
        target = editorState.widget.selected
        show()
      } else {
        hide()
      }
    } else if (changes.includes('lastChanges')) {
      // Update wizard target to new version _if_ we detect that the latest changes affected the characters that the wizard is currently targeting.
      if (isVisible) {
        const change = editorState.lastChanges.find(
          (c) =>
            c.from.line == target.line &&
            c.to.line == target.line &&
            target.start <= c.from.ch &&
            target.end >= c.to.ch
        )
        const targetWasAffected = change !== undefined
        if (targetWasAffected) {
          target = editorState.inlineElements.find(
            (e) => e.line == target.line && e.start == target.start
          )
        }
      }
    }
  }

  function onFocusout(evt) {
    if (!element.contains(evt.relatedTarget)) {
      cm.setEditorState({ type: 'deSelectWidget' })
    }
  }

  function onKeydown(evt) {
    const parentElIsFocused = document.activeElement == element

    if (evt.key == 'Tab' && !evt.altKey) {
      // Tab between inputs
      const tabbables = Array.from(
        element.querySelectorAll(
          'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        )
      )
      const index = tabbables.indexOf(document.activeElement)

      if (!evt.shiftKey) {
        if (index > -1) {
          var next = tabbables[index + 1] || tabbables[0]
        } else {
          var next = tabbables[0]
        }
      } else {
      }
      next.focus()
    } else if (
      parentElIsFocused &&
      (evt.key == 'Backspace' || evt.key == 'Delete')
    ) {
      // Delete widget
      cm.focus()
      cm.replaceRange(
        '',
        { line: target.line, ch: target.start },
        { line: target.line, ch: target.end }
      )
    } else if (evt.altKey && evt.key == 'Tab') {
      // Forward alt-tab events to `cm` by using undocumented `cm.triggerOnKeyDown` function. Per https://discuss.codemirror.net/t/signal-keydown/548/2. This ensures that alt-tab events work consistently, from user-pov, regardless of what element is focused (cm or widget).
      evt.preventDefault()
      cm.focus()
      cm.triggerOnKeyDown({
        type: 'keydown',
        keyCode: 9,
        altKey: true,
        shiftKey: evt.shiftKey,
      })
    }
  }

  /**
   * Handle closing the editor on key presses
   */
  function onKeyup(evt) {
    switch (evt.key) {
      case 'Enter':
      case 'Escape':
        cm.focus()
        break
    }
  }
  /**
   * Prevent CodeMirror from taking back focus when we try to interact with the Wizard. This seems to be due to CodeMirror's "ensureFocus" function.
   */
  // function onForwardedInteraction(evt) {
  //   console.log('onForwardedInteraction')
  //   if (evt.detail.type == 'keydown' && evt.detail.key == 'Enter') {
  //     evt.detail.preventDefault()
  //     cm.setEditorState({ type: 'deSelectWidget' })
  //   }
  // }

  // ------- ACTIONS ------ //

  /**
   * Show wizard by toggling 'isVisible' class, and setting `top` and `left` positions.
   */
  export async function show() {
    if (target == null) return

    // Update position
    // Docs: https://codemirror.net/doc/manual.html#charCoords
    const paddingOnLeftSideOfEditor = cm.display.lineSpace.offsetLeft
    leftPos = `${
      cm.cursorCoords(true, 'local').left + paddingOnLeftSideOfEditor
    }px`
    topPos = `${cm.cursorCoords(true, 'local').bottom}px`

    // Autoscroll to ensure wizard is visible. We need to call this manually, AFTER the wizard has repositioned itself (using `tick`), so autoscroll takes the wizard element into account. Otherwise it either doesn't fire, or fires too early (e.g. when the selection was set that triggered the wizard opening)
    await tick()
    cm.scrollIntoView(null)

    // Error
    isError = target.error

    // Make visible
    isVisible = true

    // Focus
    element.focus()
  }

  /**
   * Hide wizard by toggling `isVisible` class and setting position back to off-screen defaults.
   */
  function hide() {
    isVisible = false

    // Reset to default values
    leftPos = '-5000px'
    topPos = '0px'
  }
</script>

<style type="text/scss">
</style>

<!-- stopPropagation on mousedown, or CodeMirror takes focus back, closing Wizard. -->
<svelte:options accessors={true} />
<div
  id="wizard"
  bind:this={element}
  style="left:{leftPos}; top:{topPos};"
  class="below"
  class:error={isError}
  class:visible={isVisible}
  tabindex="-1"
  on:mousedown|stopPropagation
  on:keydown={onKeydown}
  on:keyup={onKeyup}
  on:focusout={onFocusout}>
  {#if !target}
    Empty!
  {:else if target.type.includes('link') || target.type.includes('image') || target.type.includes('footnote')}
    <Link {cm} {target} />
  {/if}
</div>
