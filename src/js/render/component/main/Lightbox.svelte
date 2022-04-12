<script lang='js'>
  import { state } from "../../StateManager";
  import { getFocusableElements } from "../../../shared/utils";
  import { tick } from "svelte";

  $: tabindex = $state.system.keyboardNavEnabled ? 0 : -1

  let el // This dom element
  let closeEl // close button dom element
  let prevEl // prev button dom element
  let nextEl // next button dom element
  
  // State of currently selected image
  let isError

  // Element that was focused when lightbox was opened
  // Store so we can re-focus when lightbox is closed.
  let elToRestoreFocusTo 

  $: open = $state.lightbox.open
  $: images = $state.lightbox.images
  $: index = $state.lightbox.selectedIndex
  $: image = images[index]
  
  $: if (open) {
    show()
  } else {
    hide()
  }

  async function show() {
    if (!el) return
    elToRestoreFocusTo = document.activeElement
    console.log(document.activeElement)
    el.focus()
    console.log(document.activeElement)
    el.focus()
    console.log(document.activeElement)
  }

  function hide() {
    if (!el) return
    elToRestoreFocusTo?.focus()
  }

  /**
   * Keep focus inside parentEl. If user is shift-tabbing,
   * and we're already on the first focusable element, 
   * prevent the focus from leaving the parentEl by
   * looping around and focusing the last focusable.
   * @param evt - DOM event (probably from keydown)
   * @param parentEl
   */
  function focusPrev(evt, parentEl) {
    const focusables = getFocusableElements(parentEl)
    const firstFocusable = focusables[0]
    // If first focusable el is already focused, 
    // loop around to the end.
    if (document.activeElement === firstFocusable) {
      focusables[focusables.length - 1].focus()
      evt.preventDefault()
    } else {
      // Else, do nothing. Prev focusable will be selected.
    }
  }

  /**
   * Keep focus inside parentEl. If user is tabbing,
   * and we're already on the last focusable element, 
   * prevent the focus from leaving the parentEl by
   * looping around back to the first focusable.
   * @param evt - DOM event (probably from keydown)
   * @param parentEl
   */
  function focusNext(evt, parentEl) {
    const focusables = getFocusableElements(parentEl)
    const lastFocusable = focusables[focusables.length - 1]
    // If last focusable el is already focused, 
    // loop back to the start
    if (document.activeElement === lastFocusable) {
      focusables[0].focus()
      evt.preventDefault()
    } else {
      // Do nothing. Next focusable will be selected.
    }
  }

</script>

<style lang="scss">

  #lightbox {
    color: white;
    position: fixed;
    padding: 0;
    margin: 0;
    top: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    display: grid;
    grid-template-columns: 60px 1fr 60px;
	  grid-gap: 10px;
    place-items: center;
    border-radius: var(--button-border-radius);
    overflow: hidden;
    outline: none;
  }

  #lightbox:focus {
    border: 4px solid yellow;
  }

  #lightbox:not(.open) {
    width: 0px;
    height: 0px;
    transform: translate(-100%, 0);
  }

  #lightbox.open {
    width: 100%;
    height: 100%;
    transform: translate(0, 0);
  }

  // States

  #lightbox.isBlank .wrapper::after {
		@include centered-mask-image;
		content: '';
		width: 25px;
		height: 25px;
		-webkit-mask-image: var(--imagepreview-blank-icon);
		background: var(--lightbox-icon-color);
	}
	
	#lightbox.isError:not(.isBlank) .wrapper::after {
		@include centered-mask-image;
		content: '';
		width: 30px;
		height: 30px;
		-webkit-mask-image: var(--imagepreview-error-icon);
		background: var(--lightbox-icon-color); 
	}

  #lightbox.isBlank img,
  #lightbox.isError img {
    display: none;
  }

  // Layout

  .close,
  .prev {
    grid-row: 1;
    grid-column: 1;
  }

  .wrapper {
    grid-row: 1;
    grid-column: 2;
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    overflow: hidden;
    // outline: 1px solid yellow;
    // margin: 5em 0;
  }

  img {
    max-width: 70em;
    max-height: 50em;
    object-fit: contain;
  }

  .next {
    grid-row: 1;
    grid-column: 3;
  }

  // Buttons

  .prev, 
  .next {
    @include button-reset;
    width: 100%;
    height: 100px;
    display: grid;
    place-items: center;
    &::before {
      @include centered-mask-image;
      content: '';
      width: 100%;
      height: 100%;
      // transform: translate(0, 0.5px);
      -webkit-mask-size: 16px;
      -webkit-mask-image: var(--lightbox-prev-icon);
      background: var(--lightbox-icon-color);
    }
  }

  .next::before {
    transform: scaleX(-1);
  }

  button:enabled { opacity: 0.5 }
  button:hover { opacity: 1}
  button:focus { @include focusRingAnimation(); }
  button:disabled { 
    opacity: 0; 
    pointer-events: none
  }

  .close {
    @include button-reset;
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 60px;
    display: grid;
    place-items: center;
    &::before {
      @include centered-mask-image;
      content: '';
      width: 100%;
      height: 100%;
      // transform: translate(0, 0.5px);
      -webkit-mask-size: 16px;
      -webkit-mask-image: var(--lightbox-close-icon);
      background: var(--lightbox-icon-color);
    }
  }

</style>

<div 
  id="lightbox"
  bind:this={el}
  tabindex=0
  class:open
  class:isError
  class:isBlank={!image?.url}
  on:click={() => {
    window.api.send('dispatch', { type: 'CLOSE_LIGHTBOX' })
  }}
  on:keydown={(evt) => {
    switch (evt.code) {
      case 'Escape':
      case 'Space': {
        window.api.send('dispatch', { type: 'CLOSE_LIGHTBOX' })
        break
      }
      case 'ArrowUp':
      case 'ArrowLeft': {
        if (images.length > 1 && index !== 0) {
          window.api.send('dispatch', { type: 'LIGHTBOX_PREV' })
        }
        break
      }
      case 'ArrowDown':
      case 'ArrowRight': {
        if (images.length > 1 && index !== images.length - 1) {
          window.api.send('dispatch', { type: 'LIGHTBOX_NEXT' })
        }
        break
      }
      case 'Tab': {
        if (evt.shiftKey) {
          focusPrev(evt, el)
        } else {
          focusNext(evt, el)
        }
        break
      }
    }
  }}
>
  {#if open}

    <button 
      bind:this={closeEl}
      tabindex={tabindex}
      class='close'
      on:click|stopPropagation={() => {
        window.api.send('dispatch', { type: 'CLOSE_LIGHTBOX' })
      }}
      on:keydown={(evt) => {
        if (evt.code == 'Space') {
          evt.stopPropagation()
          evt.preventDefault()
          evt.target.click()
        }
      }}
      on:mousedown|preventDefault
    >
    </button>

    <button 
      bind:this={prevEl}
      tabindex={tabindex}
      disabled={index == 0 || images.length == 1}
      class='prev'
      on:click|stopPropagation={() => {
        window.api.send('dispatch', { type: 'LIGHTBOX_PREV' })
      }}
      on:keydown={(evt) => {
        if (evt.code == 'Space') {
          evt.stopPropagation()
          evt.preventDefault()
          evt.target.click()
        }
      }}
      on:mousedown|preventDefault
    >
    </button>

    <div class="wrapper">
      <img
        src={image.url} 
        title={image.title} 
        on:click|stopPropagation
        on:error={() => isError = true}
        on:load={() => isError = false}
        alt="Lightbox"
      />
    </div>

    <button 
      bind:this={nextEl}
      tabindex={tabindex}
      disabled={index == images.length - 1}
      class='next'
      on:click|stopPropagation={(evt) => {
        if (!evt.target.disabled) {
          window.api.send('dispatch', { type: 'LIGHTBOX_NEXT' })
        }
      }}
      on:keydown={(evt) => {
        if (evt.code == 'Space') {
          evt.stopPropagation()
          evt.preventDefault()
          evt.target.click()  
        }
      }}
      on:mousedown|preventDefault
    >
    </button>
    
    <!-- {#if images.length > 1}
    {/if} -->

  {/if}
</div>