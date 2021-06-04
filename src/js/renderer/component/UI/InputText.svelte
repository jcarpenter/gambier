<script>
  import { onMount, tick } from "svelte";
  import { selectInputContents } from "../../../shared/utils";
  import { pasteAsPlainText } from "../../editor/editor-utils";
  import { state } from "../../StateManager";
  import { setAsCustomPropOnNode, setSize } from "./actions";

  export let editable = true
  export let placeholder = ''
  export let errorPlaceholder = 'Required'
  export let value = ''
  export let focused = false
  export let style = 'sidebar' // 'sidebar', 'toolbar', or 'inline'
  export let icon = undefined // Eg. 'img-arrow-up-arrow-down'
  export let width = 'auto' // '100px', 'auto', etc.
  export let margin = '0'
  export let compact = false
  export let multiLine = false
  export let multiLineMaxHeight = '28'
  export let disabled = false
  export let isError = false
  export let autofocus = false

  $: tabindex = $state.system.keyboardNavEnabled ? 0 : -1

  let inputEl

  // We use the following boolean to determine whether the
  // input was focused by a click, or a tab. So we can select 
  // text on tab, and place cursor on click.
  let wasFocusedByClick = false

  /**
   * Focus the element if `autofocus` is true
   * User in Wizard, for example, so input is
   * focused and contents selected automatically,
   * ready to be edited.
  */
  onMount(async () => {
    if (autofocus) focus()
  })

  /**
   * Enables consuming components to call
   * focus on this InpuText (which will also
   * select the contents).
   * Per https://stackoverflow.com/a/6150060
   */
  export async function focus() {
    // We have to wait a tick or `value` is liable to be empty
    await tick( )
    inputEl.focus()
  }

</script>

<style type="text/scss">

  // ------ Layout: Normal ------ //

  .inputText {
    @include system-regular-font;
    position: relative;
    border-radius: var(--button-border-radius);
    min-height: 28px;
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    padding: 0 3px 0 7px;
    // flex-grow: 1;

    &:focus-within {
      @include focusRingAnimation
    }
  }

  .icon, .errorIcon {
    @include centered-mask-image;
    min-width: 13px;
    height: 13px;
    margin-right: 3px;
  }

  .input {
    @include system-regular-font;
    margin-top: 1px;
    width: 100%;
    background: transparent;
    overflow: hidden;
    outline: none;
  }

  .showPlaceholder .input::after {
    content: attr(data-placeholder);
    user-select: none;
    pointer-events: none;
  }

  // // Hide error icon when input is focused
  // .inputText:focus-within .errorIcon {
  //   display: none
  // }

  // // Hide error placeholder when input is focused
  // .showPlaceholder.isError:focus-within .input::after {
  //   content: '';
  // }

  // Singe line
  .inputText:not(.multiLine) {  
    overflow: hidden;
    .input {
      overflow-x: scroll;
      white-space: nowrap;
      &::-webkit-scrollbar {
        height: 0px;
      }
    }
  }
  
  // Multiline
  .inputText.multiLine {
    .input {
      max-height: calc(var(--multiLineMaxHeight) * 1px);
      overflow-y: scroll;
      word-break: break-word;
      border-radius: 4px;
    }
  }


  // ------ Layout: Compact ------ //

  .inputText.compact {
    
    @include system-small-font;
    min-height: 20px;
    line-height: 20px;
    border-radius: var(--button-border-radius-compact);
    padding: 0 3px 0 4px;

    .icon, .errorIcon {
      margin-top: 0;
      margin-left: 1px;
      min-width: 11px;
      height: 11px;
    }

    .input {
      @include system-small-font;
      margin-top: 0;
      line-height: 20px;
    }
  }

  .inputText.multiLine {
    padding: 4px 4px;
    .input {
      line-height: 14px;
    }
  }

  
  // -------- STYLE: BASELINE -------- //

  .inputText.sidebar,
  .inputText.toolbar,
  .inputText.inline {
    
    .icon {
      background-color: var(--control-text-color);
      opacity: 0.8; 
    }

    .errorIcon {
      background-color: var(--error-color);
      -webkit-mask-image: var(--input-error-icon);
    }
  
    .input {
      color: var(--text-color);
    }
  }

  .showPlaceholder .input::after {
    color: var(--placeholder-text-color);
  }

  .showPlaceholder.isError .input::after {
    color: var(--error-color);
    opacity: 0.6;
  }

  .disabled {
    background-color: transparent !important;
    .input {
      opacity: 0.8;
    }
  }

  .inputText:not(:focus-within).isError {
    box-shadow: inset 0 0 0 1px var(--error-color) !important;
  }

  // -------- STYLE: 'SIDEBAR' & 'INLINE' -------- //

  .inputText.editable.sidebar,
  .inputText.editable.inline {
    @include dark {
      background-color: foregroundColor(0.05);
      box-shadow: 
        inset 0 1.5px 1px 0 black(0.1), // Top inner shadow
        // inset 0 -1px 0.5px 0 white(0.15), // Bottom bevel
        inset 0 0 0 0.5px white(0.1); // Outline
    }

    @include light {
      background-color: foregroundColor(0.05);
      box-shadow: 
        inset 0 0 0 0.5px black(0.1); // Outline
    }

    .icon {
      opacity: 0.5;
    }
  }


  // -------- STYLE: 'TOOLBAR' -------- //

  .inputText.editable.toolbar {
    border: 1px solid foregroundColor(0.05);
    .icon {
      opacity: 0.5;
    }
  }
  

  // -------- STYLE: 'INLINE' -------- //


</style>

<!-- <svelte:window on:keydown={handleKeydown} /> -->

<div 
  class="inputText {style}" 
  class:editable
  class:multiLine
  class:compact 
  class:isError
  class:disabled
  class:showPlaceholder={!value}
  use:setAsCustomPropOnNode={{multiLineMaxHeight}}
  use:setSize={{width, margin}}
  >

  <!-- Icon -->
  {#if icon}
    <div 
      class="icon"
      on:mousedown|preventDefault={() => input.select()} 
      style={`-webkit-mask-image: var(--${icon});`} 
    />
  {/if}

  <!-- 
  Editable: If field is editable and not disabled.
  Not editable: 
  -->
  {#if editable && !disabled}
    <div 
      class="input"
      contenteditable
      spellcheck="false"
      data-placeholder={isError ? errorPlaceholder : placeholder}
      tabindex={tabindex}
      bind:this={inputEl} 
      bind:textContent={value} 
      on:keydown={(evt) => {
        if (evt.key == 'Enter') {
          evt.preventDefault()
        }
      }}
      on:input
      on:paste={pasteAsPlainText}
      on:mousedown={(evt) => {
        // If user clicks on input while it's not focused
        // set `wasFocusedByClick` true. So we can use
        // it inside on:focus
        const isFocused = document.activeElement == evt.target
        if (!isFocused) wasFocusedByClick = true
      }}
      on:focus={(evt) => {
        if (wasFocusedByClick) {
          // Means it was focused by a cursor click.
          // So we do nothing, and the default behaviour
          // will happen (place cursor, don't select text).
        } else {
          // Means it was focused by `tab` press, or by a 
          // consuming component. So we select the text.
          selectInputContents(evt.target)
        }
        // Reset the checker
        wasFocusedByClick = false
      }}
    />
  {:else}
    <div 
      class="input" 
      data-placeholder={isError ? errorPlaceholder : placeholder}
    >
      {value}
    </div>
  {/if}

  <!-- Error icon -->
  {#if isError}
    <div 
      class="errorIcon"
      on:mousedown|preventDefault={() => input.select()} 
    />
  {/if}

  <!-- <input 
    tabindex="0" 
    type="text" 
    bind:this={inputEl} 
    bind:value={value} 
    on:input
  /> -->
</div>
