<script>
  export let placeholder = 'Search'
  export let query = ''
  export let focused = false

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
  @import '../../../../styles/_mixins.scss';

  .searchfield {
    @include label-normal;
    margin: 10px 10px 0;
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

  .magnifying-glass {
    @include centered_mask_image;
    @include absolute-vertical-center;
    background-color: var(--controlTextColor);
    -webkit-mask-image: var(--img-magnifyingglass);
    position: absolute;
    width: 13px;
    height: 13px;
    left: 5px;
    opacity: 0.5;
  }

  .placeholder {
    @include absolute-vertical-center;
    user-select: none;
    color: var(--placeholderTextColor);
    left: 24px;
    pointer-events: none;
  }

  input {
    @include label-normal;
    color: var(--textColor);
    margin: 1px 0 0 24px;
    width: 100%;
    background: transparent;
    outline: none;
    border: none;
  }
</style>

<svelte:window on:keydown={handleKeydown} />

<div class="searchfield">
  <div
    on:mousedown|preventDefault={() => input.select()}
    class="magnifying-glass" />
  {#if !query}
    <span class="placeholder">{placeholder}</span>
  {/if}
  <input type="text" bind:this={input} bind:value={query} />
</div>
