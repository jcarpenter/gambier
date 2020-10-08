<script>
  import { onMount, tick } from 'svelte'
  import { getCharAt } from '../../editor/editor-utils'
  import FootnoteInline from './FootnoteInline.svelte'
  import Link from './Link.svelte'

  // import { createEventDispatcher } from "svelte";
  // const dispatch = createEventDispatcher();

  export let cm = null
  export let target = null // An inlineElement
  export let element = null // The DOM element

  let visible = false
  let leftPos
  let topPos

  $: doc = cm !== null ? cm.getDoc() : null

  // Set position when element changes
  $: {
    if (target !== null) {
      const paddingOnLeftSideOfEditor = cm.display.lineSpace.offsetLeft
      topPos = `${cm.cursorCoords(true, 'local').bottom}px`
      leftPos = `${
        cm.charCoords({ line: target.line, ch: target.start }, 'local').left +
        paddingOnLeftSideOfEditor
      }px`
    }
  }

  /**
   * Wizard visibility is controlled by position absolute `left` value. Noramlly it's a few thousand px to the left. On `focus` or `focus-within`, it's positioned under the selected element.
   */
  export async function show(newElement) {
    target = newElement
    visible = true
    element.focus()
  }

  // Wizard hides when we lose focus on wizard element (`focusout` event) && the new focus target (`relatedTarget`) is NOT a child of the wizard.
  function hide(newFocusTarget) {
    if (newFocusTarget == undefined || !element.contains(newFocusTarget)) {
      visible = false
      target.widget.deHighlight()
      topPos = '-5000px'
    }
  }

  function keydown(evt) {
    if (evt.key == 'Tab' && evt.altKey) {
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
  function keyup(evt) {
    switch (evt.key) {
      case 'Escape':
        cm.focus()
        break
    }
  }

  // Called by `onChanges` handler in editor
  export function onChanges(inlineElements) {
    if (!visible) return

    // Get new version of wizard's element
    // Find inlineElement at the same start position.
    const newElement = inlineElements.find(
      (e) => e.line == target.line && e.start == target.start
    )
    if (newElement) target = newElement
  }
</script>

<style type="text/scss">
  @import "../../../../styles/_variables.scss";

  #wizard {
    --notch-size: 0.6em;
    --popup-distance: -0.5em;
    --show: 0.05s;
    --hide: 0.05s;
    --delay: 0.5s;

    background-color: hsl(0, 0%, 95%);
    border-radius: var(--grid-eighth);
    color: var(--clr-gray-darker);
    font-size: var(--font-sml-1);
    line-height: var(--grid-three-quarters);
    opacity: 0;
    padding: var(--grid-quarter);
    position: absolute;
    transform: translate(0%, 0%);
    transition-delay: var(--delay);
    transition-timing-function: ease-out;
    transition: opacity var(--hide);
    white-space: normal;
    width: 20em;
    z-index: 100;
    left: -5000px;

    &:focus,
    &:focus-within {
      opacity: 1;
      transition: opacity var(--show);
      transition-timing-function: ease-in;
    }

    h1,
    h2,
    label,
    input {
      margin: 0;
      font-size: var(--font-sml-1);
      line-height: var(--grid-three-quarters);
    }

    h1,
    h2 {
      padding-bottom: var(--grid-quarter);
    }

    label {
      padding-bottom: var(--grid-eighth);
    }

    input {
      margin-bottom: var(--grid-quarter);
    }

    textarea {
      display: block;
      width: 100%;
      font-size: var(--font-sml-1);
      padding: var(--grid-sixth);
    }

    label {
      display: block;
      &:not([required]) {
        opacity: 0.5;
        &::after {
          content: 'Optional';
          font-style: italic;
        }
      }
    }

    input {
      border-radius: 0.15em;
      width: 100%;

      &:not([required]) {
        // opacity: 0.5;
      }
    }

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
</style>

<svelte:options accessors={true} />
<div
  bind:this={element}
  style="left:{leftPos}; top:{topPos};"
  class="below"
  tabindex="-1"
  id="wizard"
  on:keydown={keydown}
  on:keyup={keyup}
  on:focusout={(e) => hide(e.relatedTarget)}>
  {#if !target}
    <!-- Empty target -->
  {:else if target.type.includes('link') || target.type.includes('image') || target.type.includes('footnote')}
    <Link {cm} {doc} {target} />
    <!-- {:else if element.type == 'footnote-inline'}
    <FootnoteInline {doc} {element} />
  -->
  {/if}
</div>
