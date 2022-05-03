<script lang='js'>  
  import { onMount, tick } from 'svelte'
  import Citation from './Citation.svelte'
  import Footnote from './Footnote.svelte'
  import ReferenceFootnote from './ReferenceFootnote.svelte'
  import Link from './Link.svelte'
  import ReferenceLink from './ReferenceLink.svelte';
  import Image from './Image.svelte'
  import ReferenceImage from './ReferenceImage.svelte';
  import { getElementAt } from '../../../editor/map';
  import FrontmatterTagPreview from './FrontmatterTagPreview.svelte';
  import UrlPreview from './UrlPreview.svelte';
  import { store } from '../../../WizardManager'
  import { setAsCustomPropOnNode } from '../../ui/actions';

  let domEl // DOM element of this Wizard
  let component // The child component to render
  let componentInstance // The rendered child component
  let element // Target element (in Gambier parlance) 
  let textMarker // TextMarker located at from/to pos of the element.
  let cm = null // CM instance we're editing
  // let panelId = ''

  // Same as above: we check on `mouseleave` to help
  // decide whether or not to close the wizard.

  // How many pixels to offset the wizard vertically from the 
  // target DOM element (e.g. inline link mark).
  let wizardOffset = 8
   
  // Min/Max widths of the wizard. We can set it based on the 
  // component being rendered.
  let minWidth = 0
  let maxWidth = 0

  // ------- LISTEN FOR STORE CHANGES ------ //

  // React the changes on store
  // $: ({suppressWarnings} = $store)

  // When CM changes, we update cm listeners (e.g. changes, scroll)/
  $: $store.panelId, onCmChanged()

  // Close wizard if isVisible changes
  $: if (!$store.isVisible) onWizardClosed()

  // Focus wizard when it becomes visible, 
  // IF it was opened by tab or click.
  $: if ($store.isVisible) {
    if ($store.openedBy.tabOrClick) {
      domEl.focus({preventScroll: true}) 
    }
  }

  // When target DOM element changes, we update the position
  $: $store.domElement, updatePosition()

  // When target element changes, we update the component (and other things).
  $: $store.element, onElementChanged()


  // ------- HANDLERS ------ //

  /**
   * When CM instance changes, update CM listeners.
   * We use these to update self when scroll or element changes.
   */
  function onCmChanged() {

    if (!$store.panelId) return
    
    // Remove listeners from outgoing cm instance
    cm?.off('changes', onChanges)
    cm?.off('scroll', onScroll)

    // Update cm variable
    cm = $store.cm

    // Add listeners to new cm instance 
    cm.on('changes', onChanges)
    cm.on('scroll', onScroll)
  }

  /**
   * When element changes, we update several values,
   * and determine the component to render.
   */
  async function onElementChanged() {

    if (!$store.element) return
    
    // Update local element value
    element = $store.element
    
    console.log(element)

    // Determine which component to render...
    // Depends on 1) element type, and 2) how the wizard was opened.
    // E.g. if we alt-tab to an inline link mark, the
    // wizard opens and shows the Link component editing UI.
    // Else, if we cmd-hover that inline link mark, we the
    // wizard opens and shows a URL preview.
    
    // The type of the target element
    const type = element.type
    
    // How was the wizard opened?
    const { tabOrClick, hover, metaKey, altKey } = $store.openedBy

    if (type == 'citation') {

      // Show citation wizard
      component = Citation

    } else if (type == 'footnote-inline' && (tabOrClick || hover)) {

      // Show footnote wizard
      component = Footnote

    } else if (type == 'frontmatter-tag' && (hover && metaKey)) {
      
      // Show prompt to search for other tags
      // Show preview of link URL
      component = UrlPreview
      await tick()
      componentInstance.url = `Search docs tagged ${element.markdown}`

    } else if (type == 'link-inline' && (hover && metaKey)) {
      
      // Show preview of link URL
      component = UrlPreview
      await tick()
      componentInstance.url = 'Open ' + element.spans.find(({type}) => type.includes('url'))?.string

    } else if (type == 'link-inline' && (tabOrClick || hover)) {

      // Show link wizard
      component = Link

    } else if (type == 'link-inline' && (hover && metaKey)) {
      
      // Show preview of link URL
      component = UrlPreview
      await tick()
      componentInstance.url = element.spans.find(({type}) => type.includes('url'))?.string

    } else if (type.equalsAny('link-reference-collapsed', 'link-reference-full') && (tabOrClick || hover)) {

      // Show reference link wizard
      component = ReferenceLink

    } else if (type.equalsAny('figure', 'image-inline') && (tabOrClick || hover)) {

      // Show image wizard (applies to both figures and inline images)
      component = Image

    } else if (type.equalsAny('image-reference-collapsed', 'image-reference-full') && (tabOrClick || hover)) {

      // Show reference image wizard
      component = ReferenceImage;

    }

    if (component == UrlPreview) {
      minWidth = '0'
      maxWidth = '22em'
    } else if (component == Citation) {
      minWidth = '23em'
      maxWidth = '23em'
    } else {
      minWidth = '20em'
      maxWidth = '22em'
    }

    // Set minWidth and maxWidth, based on component
    // switch (component) {
    //   case UrlPreview:
    //     minWidth = '0'
    //     maxWidth = '22em'
    //     break
    //   case Citation:
    //     minWidth, maxWidth = '22em'
    //     break
    //   default:
    //     minWidth = '20em'
    //     maxWidth = '22em'
    // }

    // Autoscroll to ensure wizard is visible. We need to call this manually, AFTER the wizard has repositioned itself (using `tick`), so autoscroll takes the wizard element into account. Otherwise it either doesn't fire, or fires too early (e.g. when the selection was set that triggered the wizard opening)
    // await tick()
    // cm.scrollIntoView(null)

  }

  function onWizardClosed() {

    // Clear the local variable
    element = null

    // Write pending changes (if child Wizard component does not alread
    // handle this internally.
    if (componentInstance?.writeDelayedChanges) {
      componentInstance?.writeDelayedChanges()
    }
  }

  /**
   * When 'changes' event is fired by CM instance, check
   * if the target element was affected. If yes, update the
   * wizard to match.
   * @param cm - CodeMirror instance
   * @param changes - Changes, batched per operation
   */
  function onChanges(cm, changes) {

    if (!$store.isVisible || !element) return
    
    // Check if element was affected
    const elementWasAffected = changes.find(
      ({from, to}) =>
        from.line == element.line &&
        to.line == element.line &&
        element.start <= from.ch &&
        element.end >= to.ch
    ) !== undefined

    // Get the updated target element and marker
    // We assume line and start will be the same, before and after.
    // NOTE: This may not always be true! This is a potential bug source.
    if (elementWasAffected) {
      // textMarker = cm.findMarksAt({ line: element.line, ch: element.start })
      element = getElementAt(cm, element.line, element.start + 1)

      // Hide the wizard if the element was deleted
      if (!element) store.close()
    }
  }

  /**
   * When the CM instance scrolls, update if the wizard 
   * position (if the wizard is open).
   */
  function onScroll() {
    if (!$store.isVisible || !element) return
    updatePosition()
  }


  /**
   * Handle tabbing and backspace/delete
   * @param evt
   */
  function onKeydown(evt) {
        
    const fieldsAreNotFocused = document.activeElement == domEl

    if (evt.key == 'Tab' && !evt.altKey) {
      tab(evt)
    } else if (evt.key == 'Tab' && evt.altKey) {
      altTab(evt)
    } else if (evt.key.equalsAny('Backspace', 'Delete') && fieldsAreNotFocused) {
      deleteTarget()
    } else if (evt.key == 'Enter' || evt.key == 'Escape') {
      cm.focus()
    } else if (evt.key.equalsAny('ArrowLeft', 'ArrowRight') && fieldsAreNotFocused) {
      // Close wizard if user presses arrow while no fields are selected
      cm.focus()
      cm.triggerOnKeyDown({
        type: 'keydown',
        keyCode: evt.key == 'ArrowLeft' ? 37 : 39,
        altKey: false,
        shiftKey: false,
      })
    }
  }

  /**
   * Prevent CodeMirror from taking back focus when we try to interact with the Wizard. This seems to be due to CodeMirror's "ensureFocus" function.
   */
  // function onForwardedInteraction(evt) {
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
    const { from, to } = textMarker.find()
    cm.focus()
    cm.replaceRange('', from, to)
  }

  /**
   * Tab to the prev/next input in the wizard
   */
  function tab(evt) {
    evt.preventDefault()
    const focusables = Array.from(
      domEl.querySelectorAll(`[contenteditable]:not([tabindex="-1"])`)
    )
    const indexOfFocused = focusables.indexOf(document.activeElement)
    const nothingFocused = indexOfFocused == -1
    const firstItemFocused = indexOfFocused == 0
    const lastItemFocused = indexOfFocused == focusables.length - 1

    let inputToFocus
    if (!evt.shiftKey) {
      // Tab to next focusable element.
      // If at end, loop back and focus first element.
      inputToFocus = (nothingFocused || lastItemFocused) ? focusables[0] : focusables[indexOfFocused + 1]
    } else {
      // Tab backwards to previous focusable element.
      // If at start, focus last element.
      inputToFocus = (nothingFocused || firstItemFocused) ? focusables[focusables.length - 1] : focusables[indexOfFocused - 1]
    }

    if (inputToFocus) {
      // We can't call `select()` on contenteditable, so instead we have to focus it, 
      // then call `selectAll` a moment later (or else browser selects previous scope).
      if (inputToFocus.hasAttribute('contenteditable')) {
        inputToFocus.focus()
        setTimeout(() => document.execCommand('selectAll', false, null), 1)
      } else {
        inputToFocus.select()
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
   * Update position of Wizard using `cm.charCoords`
   * Docs: https://codemirror.net/doc/manual.html#charCoords
   */
  function updatePosition() {

    // TODO: Need to get the element
    // const rect = textMarker.replacedWith.getBoundingClientRect() 
    if (!$store.domElement) return
    console.log($store.domElement)
    const rect = $store.domElement.getBoundingClientRect() 
    domEl.style.left = `${rect.left + rect.width / 2}px` 
    domEl.style.top = `${rect.top - wizardOffset}px`

    // el.style.left = `${cm.cursorCoords(true, 'window').left}px`
    // el.style.top = `${cm.cursorCoords(true, 'window').bottom}px`
  }

</script>

<style lang="scss">
    
  // #wizard.isVisible:focus-within {
  //   outline: 2px solid green !important;
  // }

  // #wizard.isVisible:not(:focus-within) {
  //   outline: 2px solid black;
  // }


  #wizard {
    --notch-size: 0.6em;
    --popup-distance: -0.5em;
    --show: 0.05s;
    --hide: 0.05s;
    --delay: 0.5s;

    @include system-regular-font;
    background-color: var(--wizard-bg);
    box-shadow: 0 0 0 var(--wizard-border-thickness) var(--wizard-border-color), 0 0 20px 2px rgba(0, 0, 0, 0.2);
    // border: var(--wizard-border-thickness) solid var(--wizard-border-color);
    border-radius: var(--wizard-border-radius);
    color: var(--label-color);
    // opacity: 1;
    // padding: 0 0 4px 0;
    padding: 0;
    position: absolute;
    transform: translate(-50%, -100%);
    transition-delay: 0.5s;
    transition-timing-function: ease-out;
    transition: opacity 0.05s;
    white-space: normal;
    min-width: var(--minWidth);
    max-width: var(--maxWidth);
    z-index: 10;
    height: auto;
    
    // transition: max-height 250ms ease-out;
    // max-height: 1000px;

    &:not(.isVisible) {
      display: none;
    }

    &.isVisible {
      display: block;
      outline: none;
      // opacity: 1;
      transition: opacity 0.05s;
      transition-timing-function: ease-in;
    }

    // &.error {
    //   border: 1px solid var(--wizard-error);
    // }
    
    svg.notch {
      position: absolute;
      bottom: 1px;
      left: 50%;
      transform: translate(-50%, 100%);
      filter: drop-shadow(0 1px 0 var(--wizard-border-color));
      path { fill: var(--wizard-bg); }
    }

    // > .notch {
    //   @include centered-mask-image;
    //   // box-shadow: 0 0 0 var(--wizard-border-thickness) var(--wizard-border-color);
    //   position: absolute;
    //   bottom: 0;
    //   left: 50%;
    //   transform: translate(-50%, 100%);
    //   width: 2em;
    //   height: 1em;
    //   background-color: var(--wizard-bg);
    //   -webkit-mask-image: url(/img/notch.svg); // Set by `icon` variable
    //   filter: drop-shadow(0 1px 5px red);
    // }

    // > img.notch {
    //   position: absolute;
    //   bottom: 0;
    //   left: 50%;
    //   transform: translate(-50%, 100%);
    //   fill: red;
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
    //     bottom: 0.05em;
    //     left: 50%;
    //     transform: translate(-50%, 50%) rotate(45deg);
    //     box-shadow: 0 0 0 var(--wizard-border-thickness) var(--wizard-border-color);
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

    // This psuedo-element adds invisible "padding" to bottom
    // of the wizard. This ensures that surface of the wizard
    // is contiguous with the mark that opens it. Which helps
    // prevent the wizard from closing unintentionally when 
    // the user opens it by hovering a mark, and then moves
    // the cursor from mark to wizard, across a small visual 
    // gap of the same height as this pseudo-element.
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      background: transparent;
      height: calc(var(--wizardOffset) * 1px + 2px);
      bottom: 0;
      left: 0;
      transform: translateY(100%);
    }
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
    @include system-small-font;
    font-weight: bold;
    color: var(--label-color);
    flex-grow: 1;
    margin: 0;
    padding: 0;
  }

  #wizard :global(.definition) {
    background-color: var(--wizard-definition-bg);
    border-top: 1px solid var(--wizard-separator);
    padding: 8px;
  }
  
  #wizard :global(.error-message) {
    @include system-small-font;
    color: var(--label-2-color);
    margin: 4px; // Nudge into alignment with fields
  }

  #wizard :global(.error-message .id) {
    color: var(--label-color);
  }
  
  #wizard :global(h2) {
    @include system-small-font;
    font-weight: bold;
    margin: 0;
  }

</style>

<!-- stopPropagation on mousedown, or CodeMirror takes focus back, closing Wizard. -->
<svelte:options accessors={true} />
<div 
  id="wizard"
  bind:this={domEl}
  use:setAsCustomPropOnNode={{wizardOffset, minWidth, maxWidth}}
  class:isVisible={$store.isVisible}
  class:isIncomplete={element?.isIncomplete}
  tabindex="-1"
  on:mousedown|stopPropagation
  on:keydown={onKeydown}
  on:focusout={(evt) => {
    if (!domEl.contains(evt.relatedTarget)) {
      store.close()
    }
  }}
  on:mouseenter={() => {
    // Close wizard if user opens it with metaKey then mouses over.
    // Meta-key incarnations of wizard are not meant to be interacted
    // with directly (goes the current thinking)
    if ($store.openedBy.metaKey) {
      store.close()
    }
  }}
  on:mouseleave={(evt) => {

    const isFocused = domEl.contains(document.activeElement)

    // if (!isFocused && $store.openedBy.altKey && evt.altKey) {
    if (!isFocused && $store.openedBy.altKey) {
    
      // If user opened wizard by hovering mark with alt-key,
      // pressed, and user has not interacted with the wizard,
      // close the wizard.
      store.close()

    } else if ($store.openedBy.metaKey) {

      // If user opened wizard by hovering mark with meta-key,
      // close the wizard on mouse leave. This is a bit more aggressive
      // than the alt key.
      store.close()

    } else if (!isFocused && !$store.openedBy.metaKey && !$store.openedBy.altKey) {

      // Else, if user opened wizard by hovering mark _without_
      // modifier keys, and user has not interacted with the 
      // wizard, close the wizard.
      store.close()
    }
  }}
>
  {#if element && component}
    {#key element}
      <svelte:component 
        this={component} 
        bind:this={componentInstance} 
        {cm} 
        {element} 
        suppressWarnings={$store.suppressWarnings}
      />
    {/key}
  {/if}
  <!-- <div class="notch"></div> -->
  <!-- <img class="notch" src="img/notch.svg"> -->

  <svg class="notch" width="16" height="8" xmlns="http://www.w3.org/2000/svg"><path d="M6.857 6.857 0 0h16L9.143 6.857a1.616 1.616 0 0 1-2.286 0Z" fill="#000" fill-rule="evenodd"/></svg>

</div>