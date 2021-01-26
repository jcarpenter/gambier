<script>
  import { setSize } from "./actions";

  export let placeholder = 'Search'
  export let query = ''
  export let focused = false
  export let style = 'sidebar' // 'sidebar', 'toolbar', or 'inline'
  export let icon = undefined // Eg. 'img-arrow-up-arrow-down'
  export let width = 'auto' // '100px', 'auto', etc.
  export let padding = '0'
  export let margin = '0'
  export let compact = false

  let input = null

  function handleKeydown(evt) {
    if (!focused) return
    
    // Focus on Cmd-F
    if (evt.key == 'f' && evt.metaKey) {
      input.select()
    }

    // Select all
    if (evt.metaKey && evt.key == 'a') {
      input.select()
    }
  }
</script>

<style type="text/scss">

  // ------ Layout: Normal ------ //

  .searchfield {
    @include label-normal;
    position: relative;
    border-radius: $border-radius-normal;
    // flex: none;
    height: 28px;
    display: inline-flex;
    flex-direction: row;
    align-items: center;

    &:focus-within {
      animation-fill-mode: forwards;
      animation-name: selectField;
      animation-duration: 0.3s;
    }
  }

  @keyframes selectField {
    from {
      box-shadow: 0 0 0 10px transparent;
    }

    to {
      box-shadow: 0 0 0 3.5px rgba(59, 153, 252, 0.5);
    }
  }

  .icon {
    @include centered_mask_image;
    min-width: 13px;
    height: 13px;
    margin-left: 7px;
  }

  .inputWrapper {
    margin: 0 3px 0 7px;
    position: relative;
    width: 100%;
  }

  .placeholder {
    @include absolute-vertical-center;
    user-select: none;
    pointer-events: none;
  }

  input {
    @include label-normal;
    margin: 1px 0 0 -2px;
    width: 100%;
    background: transparent;
    outline: none;
    border: none;
  }


  // ------ Layout: Compact ------ //

  .searchfield.compact {
    @include label-normal-small;
    height: 20px;
    border-radius: $border-radius-compact;
    line-height: 20px;
    .icon {
      @include centered_mask_image;
      min-width: 11px;
      height: 11px;
      margin-left: 5px;
    }
    input {
      line-height: 20px;
      @include label-normal-small;
    }
  }

  
  // -------- STYLE: BASELINE -------- //

  .searchfield.sidebar,
  .searchfield.toolbar,
  .searchfield.inline {
    
    .icon {
      background-color: var(--controlTextColor);
      opacity: 0.8; 
    }
  
    .placeholder {
      color: var(--placeholderTextColor);
    }
  
    input {
      color: var(--textColor);
    }
  }

  // -------- STYLE: 'SIDEBAR' & 'INLINE' -------- //

  .searchfield.sidebar,
  .searchfield.inline {
    @include dark {
      background-color: white(0.05);
      box-shadow: 
        inset 0 1.5px 1px 0 black(0.1), // Top inner shadow
        // inset 0 -1px 0.5px 0 white(0.15), // Bottom bevel
        inset 0 0 0 0.5px white(0.1); // Outline
    }

    @include light {
      background-color: black(0.05);
      box-shadow: 
        inset 0 0 0 0.5px black(0.1); // Outline
    }

    .icon {
      opacity: 0.5;
    }
  }


  // -------- STYLE: 'TOOLBAR' -------- //

  .searchfield.toolbar {
    border: 1px solid rgba(var(--foregroundColor), 0.05);
    .icon {
      opacity: 0.5;
    }
  }
  

  // -------- STYLE: 'INLINE' -------- //




</style>

<svelte:window on:keydown={handleKeydown} />

<div 
  class="searchfield {style}" 
  class:compact 
  use:setSize={{width, margin, padding}}
  >
  {#if icon}
    <div 
      class="icon"
      on:mousedown|preventDefault={() => input.select()} 
      style={`-webkit-mask-image: var(--${icon});`} 
    />
  {/if}
  <div class="inputWrapper">
    {#if !query}
      <span class="placeholder">{placeholder}</span>
    {/if}
    <input type="text" bind:this={input} bind:value={query} on:keydown />
  </div>
</div>
