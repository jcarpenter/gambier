<script>
  import { setSize, css } from "./actions";

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
  export let isDisabled = false
  export let isError = false

  let input = null

  // function handleKeydown(evt) {
  //   if (!focused) return
    
  //   // Focus on Cmd-F
  //   if (evt.key == 'f' && evt.metaKey) {
  //     input.select()
  //   }

  //   // Select all
  //   if (evt.metaKey && evt.key == 'a') {
  //     input.select()
  //   }
  // }
</script>

<style type="text/scss">

  // ------ Layout: Normal ------ //

  .inputText {
    @include label-normal;
    position: relative;
    border-radius: $border-radius-normal;
    min-height: 28px;
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    padding: 0 3px 0 7px;
    // flex-grow: 1;

    &:focus-within {
      @include focusFieldAnimation
    }
  }

  .icon, .errorIcon {
    @include centered_mask_image;
    min-width: 13px;
    height: 13px;
    margin-right: 3px;
  }

  .input {
    @include label-normal;
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
    
    @include label-normal-small;
    min-height: 20px;
    line-height: 20px;
    border-radius: $border-radius-compact;
    padding: 0 3px 0 4px;

    .icon, .errorIcon {
      margin-top: 0;
      margin-left: 1px;
      min-width: 11px;
      height: 11px;
    }

    .input {
      @include label-normal-small;
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
      background-color: var(--controlTextColor);
      opacity: 0.8; 
    }

    .errorIcon {
      background-color: var(--errorColor);
      -webkit-mask-image: var(--img-exclamationmark-circle-fill);
    }
  
    .input {
      color: var(--textColor);
    }
  }

  .showPlaceholder .input::after {
    color: var(--placeholderTextColor);
  }

  .showPlaceholder.isError .input::after {
    color: var(--errorColor);
    opacity: 0.6;
  }

  .isDisabled {
    background-color: transparent !important;
    .input {
      opacity: 0.8;
    }
  }

  .inputText:not(:focus-within).isError {
    box-shadow: inset 0 0 0 1px var(--errorColor) !important;
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
  class:isDisabled
  class:showPlaceholder={!value}
  use:css={{multiLineMaxHeight}}
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
  {#if editable && !isDisabled}
    <div 
      contenteditable
      class="input"
      data-placeholder={isError ? errorPlaceholder : placeholder}
      tabindex="0"
      bind:this={input} 
      bind:textContent={value} 
      on:keydown={(evt) => {
        if (evt.key == 'Enter') {
          evt.preventDefault()
        }
      }}
      on:input
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
    bind:this={input} 
    bind:value={value} 
    on:input
  /> -->
</div>
