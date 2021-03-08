<script>  
  import { tick } from 'svelte'
  import Citation from './Citation.svelte'
  import Footnote from './Footnote.svelte'
  import ReferenceFootnote from './ReferenceFootnote.svelte'
  import Link from './Link.svelte'
  import ReferenceLink from './ReferenceLink.svelte';
  import Image from './Image.svelte'
  import ReferenceImage from './ReferenceImage.svelte';
  import { getLineSpans } from '../../../editor/editor-utils';

  export let cm = null
  export let element = null
  export let el = null // DOM element, set with bind:this

  let isVisible = false
  let isError = false
  let leftPos = '-5000px' // Default value
  let topPos = '0px'

  cm.on('changes', onChanges)

  /**
   * Check if target element was affected by changes.
   * If yes, get the updated element.
   */
  function onChanges(cm, changes) {

    if (!isVisible) return
    
    const elementWasAffected = changes.find(
      ({from, to}) =>
        from.line == element.line &&
        to.line == element.line &&
        element.start <= from.ch &&
        element.end >= to.ch
    )

    // Get the updated target element.
    // We assume line and start will be the same, before and after.
    // NOTE: This may not always be true! This is a potential bug source.
    if (elementWasAffected) {
      const spans = getLineSpans(cm, cm.getLineHandle(element.line)) 
      element = spans.find(({line, start}) => line == element.line && start == element.start).element
      if (!element) {
        hide()
      }

      // target = cm.state.inlineElements.find((e) => 
        // e.line == target.line && e.start == target.start
      // )
    }
  }

  // ------- EVENT HANDLERS ------ //

  function onFocusout(evt) {
    if (!el.contains(evt.relatedTarget)) {
      hide()
      // cm.dispatch({ type: 'deSelectMark' })
    }
  }

  /**
   * Handle tabbing and backspace/delete
   * @param evt
   */
  function onKeydown(evt) {
    const fieldsAreNotFocused = document.activeElement == el
    const key = evt.key
    if (key == 'Tab' && !evt.altKey) {
      tab(evt)
    } else if (key == 'Tab' && evt.altKey) {
      altTab(evt)
    } else if (fieldsAreNotFocused && (key == 'Backspace' || key == 'Delete')) {
      deleteTarget()
    }
  }

  /**
   * Handle closing the editor on Enter or Escape
   */
  function onKeyup(evt) {
    if (evt.key == 'Enter' || evt.key == 'Escape') {
      cm.focus()
    }
  }

  /**
   * Prevent CodeMirror from taking back focus when we try to interact with the Wizard. This seems to be due to CodeMirror's "ensureFocus" function.
   */
  // function onForwardedInteraction(evt) {
  //   console.log('onForwardedInteraction')
  //   if (evt.detail.type == 'keydown' && evt.detail.key == 'Enter') {
  //     evt.detail.preventDefault()
  //     cm.dispatch({ type: 'deSelectMark' })
  //   }
  // }


  // ------- ACTIONS ------ //
 
  /**
   * Delete the target range
   */
  function deleteTarget() {
    cm.focus()
    cm.replaceRange(
      '',
      { line: target.line, ch: target.start },
      { line: target.line, ch: target.end }
    )
  }

  /**
   * Tab to the prev/next input in the wizard
   */
  function tab(evt) {
    evt.preventDefault()
    // Tab between inputs
    const focusables = Array.from(
      el.querySelectorAll(`[contenteditable]:not([tabindex="-1"])`)
    )
    const indexOfFocused = focusables.indexOf(document.activeElement)
    const nothingFocused = indexOfFocused == -1
    const firstItemFocused = indexOfFocused == 0
    const lastItemFocused = indexOfFocused == focusables.length - 1

    let elementToFocus
    if (!evt.shiftKey) {
      // Tab to next focusable element.
      // If at end, loop back and focus first element.
      elementToFocus = (nothingFocused || lastItemFocused) ? focusables[0] : focusables[indexOfFocused + 1]
    } else {
      // Tab backwards to previous focusable element.
      // If at start, focus last element.
      elementToFocus = (nothingFocused || firstItemFocused) ? focusables[focusables.length - 1] : focusables[indexOfFocused - 1]
    }

    if (elementToFocus) {
      // We can't call `select()` on contenteditable, so instead we have to focus it, 
      // then call `selectAll` a moment later (or else browser selects previous scope).
      if (elementToFocus.hasAttribute('contenteditable')) {
        elementToFocus.focus()
        setTimeout(() => document.execCommand('selectAll', false, null), 1)
      } else {
        elementToFocus.select()
      }
    }
  }
  
  /**
   * Forward alt-tab events to `cm` by using undocumented `cm.triggerOnKeyDown` function. Per https://discuss.codemirror.net/t/signal-keydown/548/2. This ensures that alt-tab events work consistently, from user-pov, regardless of what element is focused (cm or widget).
   * @param evt
   */
  function altTab(evt) {
    evt.preventDefault()
    cm.focus()
    cm.triggerOnKeyDown({
      type: 'keydown',
      keyCode: 9,
      altKey: true,
      shiftKey: evt.shiftKey,
    })
  }

  /**
   * Show wizard by toggling 'isVisible' class, and setting `top` and `left` positions.
   */
  export async function show(newElement) {

    element = newElement

    // Update position
    // Docs: https://codemirror.net/doc/manual.html#charCoords
    const paddingOnLeftSideOfEditor = cm.display.lineSpace.offsetLeft
    leftPos = `${
      cm.cursorCoords(true, 'local').left + paddingOnLeftSideOfEditor
    }px`
    topPos = `${cm.cursorCoords(true, 'local').bottom + 10}px`

    // Autoscroll to ensure wizard is visible. We need to call this manually, AFTER the wizard has repositioned itself (using `tick`), so autoscroll takes the wizard element into account. Otherwise it either doesn't fire, or fires too early (e.g. when the selection was set that triggered the wizard opening)
    await tick()
    cm.scrollIntoView(null)

    // Error
    // isError = target.error

    // Make visible
    isVisible = true

    // Focus
    el.focus()
  }

  /**
   * Hide wizard by toggling `isVisible` class and positioning off-screen.
   */
  function hide() {
    isVisible = false
    // Reset to default values
    leftPos = '-5000px'
    topPos = '0px'
  }

</script>

<style type="text/scss">
  #wizard {
    --notch-size: 0.6em;
    --popup-distance: -0.5em;
    --show: 0.05s;
    --hide: 0.05s;
    --delay: 0.5s;

    @include label-normal;
    background-color: var(--windowBackgroundColor);
    box-shadow: 0 0 20px 2px rgba(0, 0, 0, 0.2);
    border: var(--wizard-border-thickness) solid var(--wizard-border-color);
    border-radius: var(--wizard-border-radius);
    color: var(--labelColor);
    opacity: 0;
    // padding: 0 0 4px 0;
    padding: 0;
    position: absolute;
    transform: translate(0%, 10px);
    transition-delay: 0.5s;
    transition-timing-function: ease-out;
    transition: opacity 0.05s;
    white-space: normal;
    width: 20em;
    z-index: 100;
    
    transition: max-height 250ms ease-out;
    max-height: 1000px;

    &.visible {
      outline: none;
      opacity: 1;
      transition: opacity 0.05s;
      transition-timing-function: ease-in;
    }

    &.error {
      border: 1px solid var(--wizard-error);
    }

    // #contents {
    //   &.reference {
    //     margin-bottom: 0.5em;
    //     background-color: rgba(0, 0, 0, 0.05);
    //     padding: 0.5em;
    //     border-radius: 0.2em;
    //   }

    //   :disabled {
    //     // pointer-events: none; // TODO: Disable text selection alsopointer-events: none; // TODO: Disable text selection also
    //     opacity: 0.5;
    //   }
    // }

    // input {
    //   border-radius: 0.15em;
    //   width: 100%;

    //   &:not([required]) {
    //     // opacity: 0.5;
    //   }
    // }

    /* Notch */
    // &::before {
    //     content: "";
    //     width: var(--notch-size);
    //     height: var(--notch-size);
    //     position: absolute;
    //     transform: rotate(45deg);
    //     z-index: -1;
    //     background-color: inherit;
    // }

    // &.above {
    //     // transform: translate(-50%, -100%);
    //     // Offset by size of notch, then adjust distance with final value
    //     // top: var(--popup-distance);
    //     /* Notch */
    //     &::before {
    //         bottom: 0.05em;
    //         left: 50%;
    //         transform: translate(-50%, 50%) rotate(45deg);
    //     }
    // }

    // &.below {
    //     // transform: translate(-50%, 100%);
    //     // bottom: -0.5em;
    //     /* Notch */
    //     &::before {
    //         top: 0.05em;
    //         left: 50%;
    //         transform: translate(-50%, -50%) rotate(45deg);
    //     }
    // }
  }

  // Style headers inside child components (Link, Image, etc)

  #wizard > :global(header) {
    min-height: 24px;
    padding: 0;
    display: flex;
    position: relative;
    flex-direction: row;
    align-items: center;
    // height: 16px;
    flex: none;
    user-select: none;
    margin: 0 0 0 8px;
  }

  #wizard > :global(header h1) {
    @include label-normal-small-bold;
    color: var(--labelColor);
    flex-grow: 1;
    margin: 0;
    padding: 0;
  }

  #wizard :global(.definition) {
    background-color: black(0.06);
    border-top: 1px solid rgba(var(--foregroundColor), 0.05);
    padding: 8px;
  }
  
  #wizard :global(.error-message) {
    @include label-normal-small;
    color: var(--secondaryLabelColor);
    margin: 4px; // Nudge into alignment with fields
  }

  #wizard :global(.error-message .id) {
    color: var(--labelColor);
  }
  
  #wizard :global(h2) {
    @include label-normal-small-bold;
    margin: 0;
  }

</style>

<!-- stopPropagation on mousedown, or CodeMirror takes focus back, closing Wizard. -->
<svelte:options accessors={true} />
<div 
  id="wizard"
  bind:this={el}
  style="left:{leftPos}; top:{topPos};"
  class="below"
  class:error={isError}
  class:visible={isVisible}
  tabindex="-1"
  on:mousedown|stopPropagation
  on:keydown={onKeydown}
  on:keyup={onKeyup}
  on:focusout={onFocusout}
>
  {#if !element}
    Empty!
  {:else if element.type == 'citation'}
    <Citation {cm} {element} />
  {:else if element.type == 'footnote-inline'}
    <Footnote {cm} {element} />
  {:else if element.type == 'footnote-reference'}
    <ReferenceFootnote {cm} {element} />
  {:else if element.type == 'link-inline'}
    <Link {cm} {element} />
  {:else if element.type.includes('link-reference')}
    <ReferenceLink {cm} {element} />
  {:else if element.type == 'image-inline'}
    <Image {cm} {element} />
  {:else if element.type.includes('image-reference')}
    <ReferenceImage {cm} {element} />
  {/if}
</div>