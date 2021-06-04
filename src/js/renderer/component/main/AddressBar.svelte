<script>
  export let state = {}
  export let placeholder = 'Search'
  export let query = ''
  export let focused = false

  let input = null

  // $: console.log(state.openDoc)

  function handleKeydown(evt) {
    if (!focused) return
    if (evt.key == 'f' && evt.metaKey) {
      input.select()
    }
  }
</script>

<style type="text/scss">

  #addressbar {
    margin: 0 auto;
  }

  .searchfield {
    @include system-regular-font;
    position: relative;
    background-color: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
    min-height: 20px;
    min-width: 20rem;
    max-width: 40rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    // border: 1px solid black;

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
    @include centered-mask-image;
    @include absolute-vertical-center;
    background-color: var(--control-text-color);
    -webkit-mask-image: var(--img-magnifyingglass);
    position: absolute;
    width: 13px;
    height: 13px;
    left: 5px;
    opacity: 0.5;
  }

  .placeholder {
    @include absolute-vertical-center;
    color: var(--placeholder-text-color);
    left: 24px;
    pointer-events: none;
  }

  input {
    @include system-regular-font;
    margin: 1px 0 0 24px;
    width: 100%;
    background: transparent;
    outline: none;
    border: none;
  }
</style>

<svelte:window on:keydown={handleKeydown} />

<div id="addressbar">
  <div class="searchfield">
    <div
      on:mousedown|preventDefault={() => input.select()}
      class="magnifying-glass" />
    {#if !query}<span class="placeholder">{placeholder}</span>{/if}
    <input type="text" bind:this={input} bind:value={query} />
  </div>
</div>
