<script>
  import { setSize } from "./actions";

  export let placeholder = 'Search'
  export let query = ''
  export let focused = false
  export let icon = undefined // E.g. 'img-arrow-up-arrow-down'
  export let width = 'auto'
  export let padding = '0'
  export let margin = '0'
  export let isCompact = false

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

  .searchfield.isCompact {
    min-height: 22px;
    border-radius: 5px;
  }

  .searchfield {
    @include label-normal;
    position: relative;
    background-color: rgba(var(--foregroundColor), 0.05);
    border-radius: 6px;
    min-height: 28px;
    display: flex;
    flex-direction: row;
    align-items: center;
    border: 1px solid rgba(var(--foregroundColor), 0.05);

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
    // @include absolute-vertical-center;
    background-color: var(--controlTextColor);
    -webkit-mask-image: var(--img-magnifyingglass);
    // position: absolute;
    min-width: 13px;
    height: 13px;
    margin-left: 7px;
    // left: 5px;
    opacity: 0.8;
  }

  .inputWrapper {
    margin-left: 7px;
    position: relative;
  }

  .placeholder {
    @include absolute-vertical-center;
    user-select: none;
    color: var(--placeholderTextColor);
    pointer-events: none;
  }

  input {
    @include label-normal;
    color: var(--textColor);
    margin: 1px 0 0 -2px;
    width: 100%;
    background: transparent;
    outline: none;
    border: none;
  }
</style>

<svelte:window on:keydown={handleKeydown} />

<div class="searchfield" class:isCompact use:setSize={{width, margin, padding}}>
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
    <input type="text" bind:this={input} bind:value={query} />
  </div>
</div>
